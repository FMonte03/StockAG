import pandas as pd
import numpy as np
from FundamentalScript import FundamentalScraper
from models import SessionLocal, Fundamental, Stock, PriceHistory
from sqlalchemy.orm import Session
import time

tickers = ['UNH', 'PLD', 'CC', 'AEP', 'GOOGL', 'MLM', 'PINS', 'ORA', 'SPG', 'C', 'OTIS', 'APD', 'MU', 'KDP', 'EMR', 'DUK', 'IFF', 'XOM', 'CVX', 'HSY', 'AXP', 'NEXT', 'GS', 'RBLX', 'TXN', 'NTRS', 'GE', 'ADBE', 'CLX', 'MET', 'WY', 'BUD', 'KMB', 'EOG', 'ICE', 'COF', 'REGN', 'PEP', 'VLO', 'NOC', 'CAT', 'PEG', 'MDB', 'SCHW', 'PGR', 'PSA', 'DD', 'BA', 'ABBV', 'CVS', 'ZM', 'UNP', 'CDNS', 'CCI', 'FOXA', 'ALL', 'DE', 'AMR', 'LRCX', 'EXC', 'SRE', 'STT', 'ENPH', 'HD', 'BE', 'BAC', 'EQR', 'ROKU', 'CHTR', 'SEDG', 'AMAT', 'CRWD', 'INFY', 'HUM', 'IRM', 'KIM', 'MDLZ', 'CRSR', 'CSX', 'FDX', 'FANG', 'VTR', 'BLK', 'FOX', 'AFRM', 'TGT', 'SO', 'DOCS', 'RTX', 'BABA', 'MMC', 'DDOG', 'DEO', 'ORCL', 'PNC', 'PG', 'JNJ', 'COP', 'TRV', 'TD', 'FCX', 'BALL', 'WBD', 'OKTA', 'PARR', 'NVDA', 'COST', 'VZ', 'ASML', 'PH', 'PYPL', 'IBM', 'PLUG', 'CRM', 'LOW', 'COIN', 'EMN', 'MOS', 'TFC', 'NUE', 'IP', 'ZS', 'UL', 'NOW', 'AON', 'SNAP', 'KO', 'DOCU', 'WMT', 'UPS', 'LIN', 'ECL', 'LMT', 'WMB', 'PKG', 'NET', 'VRTX', 'PRU', 'BTU', 'TSM', 'HOOD', 'NVO', 'LUMN', 'FYBR', 'O', 'METC', 'MRVL', 'VMC', 'ADI', 'MCD', 'ABNB', 'SLB', 'DASH', 'BKNG', 'AMT', 'EQIX', 'MDT', 'KLAC', 'ITW', 'KMI', 'ETN', 'RUN', 'ILMN', 'RHI', 'SNPS', 'NOK', 'GILD', 'UBER', 'HST', 'SHOP', 'DVN', 'TMO', 'TMUS', 'AVGO', 'INTC', 'FAST', 'OXY', 'MSFT', 'BMY', 'D', 'SMR', 'NXPI', 'ALB', 'ZBH', 'FRT', 'MRK', 'DG', 'ERIC', 'AMD', 'TJX', 'TSLA', 'CME', 'CL', 'CF', 'VST', 'ESS', 'REG', 'WFC', 'TEAM', 'MPC', 'ISRG', 'HON', 'LLY', 'BK', 'SBUX', 'BIIB', 'CMCSA', 'COMM', 'QCOM', 'DHR', 'AMGN', 'BSX', 'SIRI', 'ULTA', 'INTU', 'DIS', 'DAL', 'GD', 'PANW', 'JCI', 'AMZN', 'TM', 'NEE', 'CI', 'EL', 'NSC', 'DOW', 'SOC', 'SAP', 'APA', 'UDR', 'PFE', 'EXR', 'PSX', 'OKE', 'CE', 'LYB', 'NKE', 'META', 'MS', 'MEOH', 'T', 'CMI', 'BXP', 'SHW', 'PPG', 'JD', 'CCJ', 'SONY', 'YUM', 'MAA', 'CPT', 'EW', 'LYFT', 'AAPL', 'HCC', 'MMM', 'NFLX', 'AVB', 'DLTR', 'JPM', 'USB']

def update_fundamentals():
    db: Session = SessionLocal()
    total_tickers = len(tickers)
    print(f"Starting update for {total_tickers} tickers...")

    try:
        for index, ticker_symbol in enumerate(tickers):
            try:
                scraper = FundamentalScraper(ticker_symbol)
                data = scraper.getFundamentals()
                
                if not data:
                    print(f"Skipping {ticker_symbol}: No data returned.")
                    continue

                for key, value in data.items():
                    if value == "":
                        data[key] = None
                
                stock = db.query(Stock).filter(Stock.ticker == ticker_symbol).first()
                if not stock:
                    new_stock = Stock(ticker=ticker_symbol, company_name=data.get('company_name'))
                    db.add(new_stock)
                    db.commit()

                db.query(Fundamental).filter(Fundamental.ticker == ticker_symbol).delete()
                
                fundamental_entry = Fundamental(
                    ticker=ticker_symbol,
                    snapshot_date=data.get("snapshot_date"),
                    revenue_growth_yoy=data.get("revenue_growth_YoY"),
                    debt_to_equity=data.get("debt_to_equity"),
                    interest_coverage=data.get("interest_coverage"),
                    free_cash_flow_positive=data.get("free_cash_flow_positive"),
                    roe=data.get("roe"),
                    profit_margin=data.get("profit_margin"),
                    current_ratio=data.get("current_ratio"),
                    eps_ttm=data.get("EPS TTM"),
                    pe_ttm=data.get("P/E TTM"),
                    analyst_rating=data.get("Analyst Rating"),
                    peg_5y=data.get("5y PEG"),
                    week_range_52=data.get("52 Week Range"),
                    day_range=data.get("Day Range"),
                    current_price=data.get("Current Price"),
                    perf_1y=data.get("perf_1y"),
                    beta=data.get("beta"),
                    pe_trailing=data.get("pe_trailing"),
                    market_cap=data.get("market_cap"),
                )
                
                db.add(fundamental_entry)
                
                try:
                    price_history_data = scraper.getPriceHistory()
                    if price_history_data:
                        db.query(PriceHistory).filter(PriceHistory.ticker == ticker_symbol).delete()
                        
                        for price_point in price_history_data:
                            price_entry = PriceHistory(
                                ticker=ticker_symbol,
                                date=price_point['date'],
                                open_price=price_point['open_price'],
                                high_price=price_point['high_price'],
                                low_price=price_point['low_price'],
                                close_price=price_point['close_price'],
                                volume=price_point['volume']
                            )
                            db.add(price_entry)
                        print(f"Added {len(price_history_data)} price history records")
                except Exception as e:
                    print(f"Error updating price history: {e}")
                
                progress = round(((index + 1) / total_tickers) * 100, 2)
                print(f"[{progress}%] Updated {ticker_symbol}")

                db.commit()

            except Exception as e:
                print(f"Error processing {ticker_symbol}: {e}")
                db.rollback() 
                continue

        print("All updates completed.")

    except Exception as e:
        print(f"Critical Error: {e}")
    finally:
        db.close()


update_fundamentals()
