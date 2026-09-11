const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const db = require("./db/database");


// ======================================================
// GOOGLE DRIVE INTEGRATION (OAuth2 — personal account)
//
// Uses the OWNER's Google account via a one-time "Sign in
// with Google" connect step. Files are stored in the
// login account's own Drive, using its free storage.
//
// - getAuthUrl()   -> URL to open for the one-time connect
// - saveAuthCode() -> exchange the pasted code for tokens
// - uploadLatest() -> replace "petrol_pump_latest.db"
// - downloadLatest()-> pull the latest file back
//
// Config (server/.env):
//   DRIVE_CLIENT_ID     - OAuth 2.0 Client ID (Desktop app)
//   DRIVE_CLIENT_SECRET - OAuth 2.0 Client Secret
//   DRIVE_FOLDER_ID     - optional Drive folder; if empty,
//                         file goes to Drive root
// ======================================================

const CLIENT_ID =
    process.env.DRIVE_CLIENT_ID;

const CLIENT_SECRET =
    process.env.DRIVE_CLIENT_SECRET;

const FOLDER_ID =
    process.env.DRIVE_FOLDER_ID || null;

const FILE_NAME =
    "petrol_pump_latest.db";

const TOKEN_FILE =
    path.join(__dirname, "db", "drive_tokens.json");

// Shows the code on screen for the user to copy-paste
const REDIRECT_URI =
    "urn:ietf:wg:oauth:2.0:oob";


// ======================================================
// OAUTH
// ======================================================

function getOAuth() {

    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error(
            "DRIVE_CLIENT_ID / DRIVE_CLIENT_SECRET are not set in server/.env"
        );
    }

    return new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );

}


function loadTokens() {

    if (!fs.existsSync(TOKEN_FILE)) {
        return null;
    }

    return JSON.parse(
        fs.readFileSync(TOKEN_FILE, "utf8")
    );

}


function saveTokens(tokens) {

    fs.writeFileSync(
        TOKEN_FILE,
        JSON.stringify(tokens, null, 2)
    );

}


function getAuthClient() {

    const oauth = getOAuth();

    const tokens = loadTokens();

    if (
        !tokens ||
        !tokens.refresh_token
    ) {
        throw new Error(
            "Google Drive is not connected yet. " +
            "Connect it from the Admin panel."
        );
    }

    oauth.setCredentials(tokens);

    return oauth;

}


// ======================================================
// ONE-TIME CONNECT FLOW
// ======================================================

function getAuthUrl() {

    const oauth = getOAuth();

    return oauth.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/drive.file"
        ]
    });

}


async function saveAuthCode(code) {

    const oauth = getOAuth();

    const { tokens } = await oauth.getToken(
        String(code).trim()
    );

    saveTokens(tokens);

    return true;

}


function isConnected() {

    try {
        getAuthClient();
        return true;
    } catch {
        return false;
    }

}


// ======================================================
// FIND THE LATEST FILE (if it exists)
// ======================================================

async function findLatest(d) {

    const res = await d.files.list({
        q: `name='${FILE_NAME}' and trashed=false`,
        fields: "files(id, name, createdTime)",
        pageSize: 1
    });

    return (
        res.data.files &&
        res.data.files[0]
    ) ? res.data.files[0] : null;

}


// ======================================================
// UPLOAD (replace single file on Drive)
// ======================================================

async function uploadLatest() {

    const auth = getAuthClient();

    const d = google.drive({
        version: "v3",
        auth
    });

    // Consistent snapshot of the live DB to a temp file
    const tmp = path.join(
        __dirname,
        "db",
        "_upload_tmp.db"
    );

    // NOTE: db.backup() is async — must await it so the
    // snapshot finishes before we read the file, and so no
    // background backup keeps running after a restore closes
    // the connection.
    await db.backup(tmp);

    const requestBody = {
        name: FILE_NAME
    };

    if (FOLDER_ID) {
        requestBody.parents = [FOLDER_ID];
    }

    let fileId;
    let replaced = false;

    const existing = await findLatest(d);

    if (existing) {

        // Update existing file in place (same file, new content)
        const res = await d.files.update({
            fileId: existing.id,
            media: {
                body: fs.createReadStream(tmp)
            }
        });

        fileId = res.data.id;
        replaced = true;

    } else {

        // Create a new file
        const res = await d.files.create({
            requestBody,
            media: {
                body: fs.createReadStream(tmp)
            }
        });

        fileId = res.data.id;

    }

    // Remove the temp copy
    try {
        fs.unlinkSync(tmp);
    } catch (err) {
        // ignore
    }

    console.log(
        `[DRIVE] Uploaded ${FILE_NAME} (${replaced ? "replaced" : "created"})`
    );

    return { fileId, replaced };

}


// ======================================================
// DOWNLOAD (to a temp file for restore)
// ======================================================

async function downloadLatest() {

    const auth = getAuthClient();

    const d = google.drive({
        version: "v3",
        auth
    });

    const existing = await findLatest(d);

    if (!existing) {
        throw new Error(
            "No backup found on Google Drive yet. Upload first."
        );
    }

    const tmp = path.join(
        __dirname,
        "db",
        "_restore_tmp.db"
    );

    const res = await d.files.get(
        {
            fileId: existing.id,
            alt: "media"
        },
        { responseType: "stream" }
    );

    await new Promise((resolve, reject) => {

        const dest = fs.createWriteStream(tmp);

        res.data
            .on("error", reject)
            .on("end", resolve)
            .pipe(dest);

    });

    console.log(
        `[DRIVE] Downloaded ${FILE_NAME} from Drive`
    );

    return tmp;

}


module.exports = {
    getAuthUrl,
    saveAuthCode,
    isConnected,
    uploadLatest,
    downloadLatest
};