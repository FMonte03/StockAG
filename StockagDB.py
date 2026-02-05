import pandas as pd
from models import SessionLocal, Fundamental, Stock, engine, Base
import numpy as np 

if __name__ == "__main__":
    print("Connecting to database and creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created/verified.")

    df = pd.read_csv('Fundamentals.csv')
    df = df.replace({np.nan: None})
    db = SessionLocal()
    
    try:
        print("Processing records...")
        for index, row in df.iterrows():
            entry = row.to_dict()
            ticker_symbol = entry.get('ticker')
            
            if not ticker_symbol:
                continue

            # 1. Ensure the Stock entry exists (Foreign Key requirement)
            stock = db.query(Stock).filter(Stock.ticker == ticker_symbol).first()
            if not stock:
                new_stock = Stock(
                    ticker=ticker_symbol, 
                    company_name=entry.get('company_name')
                )
                db.add(new_stock)
                db.flush() # Sync with DB but don't commit yet

            # 2. Check if fundamental already exists (avoid duplicates)
            db.query(Fundamental).filter(Fundamental.ticker == ticker_symbol).delete()

            # 3. Add the Fundamental data
            fundamentals = Fundamental(
                ticker=ticker_symbol,
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
            
            if (index + 1) % 50 == 0:
                print(f"Processed {index + 1} records...")

        db.commit()
        print("SUCCESS: Data fully uploaded/updated in the cloud database!")
    except Exception as e:
        db.rollback()
        print(f"ABORTED: Error occurred: {e}")
    finally:
        db.close()