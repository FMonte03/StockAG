import pandas as pd
from models import SessionLocal, Fundamental
import numpy as np 

df = pd.read_csv('Fundamentals.csv')
df = df.replace({np.nan: None})
db = SessionLocal()
try:
    for index, row in df.iterrows():
        entry = row.to_dict()

        fundamentals = Fundamental(
            ticker=entry.get('ticker'),
            snapshot_date=entry.get("snapshot_date"),
            revenue_growth_yoy=entry.get("revenue_growth_YoY"),
            debt_to_equity=entry.get("debt_to_equity"),
            interest_coverage=entry.get("interest_coverage"),
            free_cash_flow_positive=entry.get("free_cash_flow_positive"),
            roe=entry.get("roe"),
            profit_margin=entry.get("profit_margin"),
            current_ratio=entry.get("current_ratio"),
            eps_ttm=entry.get("EPS TTM"),
            pe_ttm=entry.get("P/E TTM"),
            analyst_rating=entry.get("Analyst Rating"),
            peg_5y=entry.get("5y PEG"),
            week_range_52=entry.get("52 Week Range"),
            day_range=entry.get("Day Range"),
            current_price=entry.get("Current Price"),
            perf_1y=entry.get("perf_1y"),
            beta=entry.get("beta"),
            pe_trailing=entry.get("pe_trailing"),
            market_cap=entry.get("market_cap"),
        )

        db.add(fundamentals)
    db.commit()
    print("Fundamentals inserted successfully")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()