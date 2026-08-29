function FuelCard({
    machineNo,
    nozzle,
    fuelType,
    opening,
    closing,
    testing,
    totalLitres,
    fuelPrice,
    totalAmount,
    isInvalid,
    onOpeningChange,
    onClosingChange,
    onTestingChange
}) {
    const openingValue = Number(opening) || 0;
    const closingValue = Number(closing) || 0;
    const testingValue = Number(testing) || 0;

    const meterDifference =
        closingValue - openingValue;

    const testingInvalid =
        testing !== "" &&
        testingValue > meterDifference;

    return (
        <div className="card shadow-sm h-100">

            <div className="card-body">

                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-3">

                    <div>
                        <h5 className="card-title mb-1">
                            Nozzle {nozzle}
                        </h5>

                        <small className="text-muted">
                            Machine {machineNo}
                        </small>
                    </div>

                    <span
                        className={`badge ${
                            fuelType === "PETROL"
                                ? "bg-success"
                                : "bg-dark"
                        }`}
                    >
                        {fuelType}
                    </span>

                </div>


                {/* CLOSING - FIRST */}
                <div className="mb-3">

                    <label className="form-label fw-semibold">
                        Closing Reading
                    </label>

                    <input
                        type="number"
                        step="0.01"
                        className={`form-control ${
                            isInvalid &&
                            closingValue < openingValue
                                ? "is-invalid"
                                : ""
                        }`}
                        placeholder="Enter closing"
                        value={closing}
                        onChange={(e) =>
                            onClosingChange(
                                e.target.value
                            )
                        }
                    />

                    {isInvalid &&
                        closingValue < openingValue && (
                            <div className="invalid-feedback">
                                Closing reading cannot be
                                less than opening reading.
                            </div>
                        )}

                </div>


                {/* OPENING - SECOND */}
                <div className="mb-3">

                    <label className="form-label fw-semibold">
                        Opening Reading
                    </label>

                    <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        placeholder="Enter opening"
                        value={opening}
                        onChange={(e) =>
                            onOpeningChange(
                                e.target.value
                            )
                        }
                    />

                </div>


                {/* TESTING - THIRD */}
                <div className="mb-3">

                    <label className="form-label fw-semibold">
                        Testing (Litres)
                    </label>

                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        className={`form-control ${
                            testingInvalid
                                ? "is-invalid"
                                : ""
                        }`}
                        placeholder="Enter testing litres"
                        value={testing}
                        onChange={(e) =>
                            onTestingChange(
                                e.target.value
                            )
                        }
                    />

                    {testingInvalid && (
                        <div className="invalid-feedback">
                            Testing litres cannot be greater
                            than the meter difference.
                        </div>
                    )}

                    <small className="text-muted">
                        Testing fuel will be deducted
                        from today's sale.
                    </small>

                </div>


                <hr />


                {/* METER DIFFERENCE */}
                <div className="d-flex justify-content-between mb-2">

                    <span className="text-muted">
                        Meter Difference
                    </span>

                    <strong>
                        {Math.max(
                            0,
                            meterDifference
                        ).toFixed(2)} L
                    </strong>

                </div>


                {/* TESTING DEDUCTION */}
                <div className="d-flex justify-content-between mb-2">

                    <span className="text-muted">
                        Testing
                    </span>

                    <strong>
                        - {testingValue.toFixed(2)} L
                    </strong>

                </div>


                {/* SALE LITRES */}
                <div className="d-flex justify-content-between mb-3">

                    <span className="text-muted">
                        Sale Litres
                    </span>

                    <strong className="fs-5">
                        {totalLitres.toFixed(2)} L
                    </strong>

                </div>


                {/* PRICE */}
                <div className="d-flex justify-content-between mb-2">

                    <span className="text-muted">
                        Price / L
                    </span>

                    <strong>
                        ₹{fuelPrice.toFixed(2)}
                    </strong>

                </div>


                {/* TOTAL AMOUNT */}
                <div className="d-flex justify-content-between">

                    <span className="text-muted">
                        Total Amount
                    </span>

                    <strong className="fs-5">
                        ₹{totalAmount.toFixed(2)}
                    </strong>

                </div>

            </div>

        </div>
    );
}

export default FuelCard;