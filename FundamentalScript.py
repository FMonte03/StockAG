import yfinance as yf
import pandas as pd
import numpy as np
from datetime import date
import warnings

class FundamentalScraper: 
    def __init__(self, ticker):
        self.ticker = ticker 
        self.tickerFundamentals = {
            "ticker": self.ticker, 
            'company_name': "",
            'snapshot_date': date.today().strftime("%m/%d/%Y"), 
            "revenue_growth_YoY": "",  
            "debt_to_equity": "", 
            "interest_coverage": "", 
            "free_cash_flow_positive": "", 
            "roe": "", 
            "profit_margin": "", 
            "current_ratio": "", 
            "market_cap": "", 
            "pe_trailing": "", 
            "beta": "", 
            "perf_1y": ""


        }

    def setFundamentals(self, ticker): 
        ticker = yf.Ticker(ticker)
        try:
            quarterly_income_stmt = ticker.quarterly_income_stmt
            last_quarter_data = quarterly_income_stmt.iloc[:, 0]
        except Exception as e:
            quarterly_income_stmt = None
            last_quarter_data = None
        
        try:
            quarterly_balance_sheet = ticker.quarterly_balance_sheet
            last_quarter_bs = quarterly_balance_sheet.iloc[:, 0]
        except Exception as e:
            quarterly_balance_sheet = None
            last_quarter_bs = None
        
        try:
            quarterly_cashflow = ticker.quarterly_cashflow
            last_quarter_cf = quarterly_cashflow.iloc[:, 0]
        except Exception as e:
            quarterly_cashflow = None
            last_quarter_cf = None
        
        try:
            annual_financials = ticker.financials
        except Exception as e:
            annual_financials = None
        
        try:
            revenue_data = annual_financials.loc['Total Revenue'].iloc[:2]
            current_year_revenue = revenue_data.iloc[0] 
            previous_year_revenue = revenue_data.iloc[1]
            revenueGrowthYoY = (current_year_revenue - previous_year_revenue) / previous_year_revenue
            self.tickerFundamentals['revenue_growth_YoY'] = revenueGrowthYoY.item()
        except Exception as e:
            self.tickerFundamentals['revenue_growth_YoY'] = ""
        
        try:
            info = ticker.info
        except Exception as e:
            info = {}
        print(info)
        try:
            self.tickerFundamentals['company_name'] = info.get('displayName', "")
            if self.tickerFundamentals['company_name'] == "": 
                self.tickerFundamentals['company_name'] = info.get('shortName', "")
        except Exception as e:
            self.tickerFundamentals['company_name'] = ""
        
        try:
            self.tickerFundamentals['EPS TTM'] = info.get('trailingEps', "")
        except Exception as e:
            self.tickerFundamentals['EPS TTM'] = ""
        
        try:
            self.tickerFundamentals['P/E TTM'] = info.get('trailingPE', "")
        except Exception as e:
            self.tickerFundamentals['P/E TTM'] = ""
        
        try:
            self.tickerFundamentals['Analyst Rating'] = info.get('averageAnalystRating', "")
        except Exception as e:
            self.tickerFundamentals['Analyst Rating'] = ""
        
        try:
            self.tickerFundamentals['5y PEG'] = info.get('trailingPegRatio', "")
        except Exception as e:
            self.tickerFundamentals['5y PEG'] = ""
        
        try:
            self.tickerFundamentals['52 Week Range'] = info.get('fiftyTwoWeekRange', "")
        except Exception as e:
            self.tickerFundamentals['52 Week Range'] = ""
        
        try:
            self.tickerFundamentals['Day Range'] = info.get('regularMarketDayRange', "")
        except Exception as e:
            self.tickerFundamentals['Day Range'] = ""
        
        try:
            self.tickerFundamentals['Current Price'] = info.get('currentPrice', "")
        except Exception as e:
            self.tickerFundamentals['Current Price'] = ""
        
        try:
            Debt = last_quarter_bs.loc['Total Debt']
            Equity = last_quarter_bs.loc['Stockholders Equity']
            Debt_to_equity = Debt / Equity
            self.tickerFundamentals['debt_to_equity'] = Debt_to_equity.item()
        except Exception as e:
            self.tickerFundamentals['debt_to_equity'] = ""
        
        try:
            lastIncome = annual_financials.iloc[:, 0]
            ebit = lastIncome.loc['Operating Income']
            interest_expense = abs(lastIncome.loc['Interest Expense'])
            interest_coverage = ebit / interest_expense
            self.tickerFundamentals['interest_coverage'] = interest_coverage.item()
        except Exception as e:
            self.tickerFundamentals['interest_coverage'] = ""
        
        try:
            freeCashFlow = ticker.cash_flow.loc['Free Cash Flow'].iloc[0]
            isFreeCashFlowPositive = freeCashFlow > 0 
            self.tickerFundamentals['free_cash_flow_positive'] = isFreeCashFlowPositive.item()
        except Exception as e:
            self.tickerFundamentals['free_cash_flow_positive'] = ""
        
        try:
            ROE = info['returnOnEquity']
            self.tickerFundamentals['roe'] = ROE
        except Exception as e:
            self.tickerFundamentals['roe'] = ""
        
        try:
            profitMargin = info['profitMargins']
            self.tickerFundamentals['profit_margin'] = profitMargin
        except Exception as e:
            self.tickerFundamentals['profit_margin'] = ""
        
        try:
            currentAssets = last_quarter_bs.loc['Current Assets']
            currentLiabilities = last_quarter_bs.loc['Current Liabilities'] 
            currentRatio = currentAssets / currentLiabilities
            self.tickerFundamentals['current_ratio'] = currentRatio.item()
        except Exception as e:
            self.tickerFundamentals['current_ratio'] = ""

        try:
            self.tickerFundamentals['market_cap'] = info.get('marketCap', "")
        except Exception:
            self.tickerFundamentals['market_cap'] = ""

        try:
            self.tickerFundamentals['perf_1y'] = info.get('52WeekChange', "")
        except Exception:
            self.tickerFundamentals['perf_1y'] = ""

    def getFundamentals(self): 
        self.setFundamentals(self.ticker)
        return self.tickerFundamentals

    def getPriceHistory(self):
        try:
            ticker = yf.Ticker(self.ticker)
            hist = ticker.history(period="5y")
            
            if hist.empty:
                return []
            
            price_data = []
            for date, row in hist.iterrows():
                price_data.append({
                    'date': date.date(),  # Convert to date object
                    'open_price': float(row['Open']) if not pd.isna(row['Open']) else None,
                    'high_price': float(row['High']) if not pd.isna(row['High']) else None,
                    'low_price': float(row['Low']) if not pd.isna(row['Low']) else None,
                    'close_price': float(row['Close']) if not pd.isna(row['Close']) else None,
                    'volume': float(row['Volume']) if not pd.isna(row['Volume']) else None,
                })
            
            return price_data
        except Exception as e:
            print(f"Error fetching price history for {self.ticker}: {e}")
            return []