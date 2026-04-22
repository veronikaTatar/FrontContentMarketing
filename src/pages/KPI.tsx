const KPI = () => {
    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Цели KPI</h1>
                    <p className="muted">Задайте месячные цели по вовлечённости.</p>
                </div>
                <button className="btn primary">Сохранить цели</button>
            </div>

            <div className="panel form-grid">
                <label>
                    Цель по лайкам
                    <input type="number" placeholder="5000" />
                </label>
                <label>
                    Цель по просмотрам
                    <input type="number" placeholder="120000" />
                </label>
                <label>
                    Цель по репостам
                    <input type="number" placeholder="1200" />
                </label>
            </div>
        </div>
    );
};

export default KPI;
