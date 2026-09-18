/**
 * Shared domain types — mirrors the Spring Boot V1 REST contracts exactly.
 * Do not invent fields: the API returns only what is declared here.
 */

export type Exchange = 'NSE' | 'BSE' | string

export interface Stock {
  id: number
  symbol: string
  companyName: string
  exchange: Exchange
  createdAt: string
  updatedAt: string
}

export interface CreateStockPayload {
  symbol: string
  companyName: string
  exchange: string
}

export interface Watchlist {
  id: number
  name: string
  active: boolean
  createdAt: string
  stocks: Stock[]
}

export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface Schedule {
  id: number
  watchlistId: number
  frequency: Frequency
  timezone: string
  nextRunAt: string | null
  lastRunAt: string | null
  active: boolean
}

export interface UpsertSchedulePayload {
  frequency: Frequency
  timezone: string
  active: boolean
}

export type Signal = 'BUY_MORE' | 'HOLD' | 'REVIEW' | 'HIGH_RISK' | 'INSUFFICIENT_DATA'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type TriggerType = 'SCHEDULED' | 'MANUAL'

export interface StockAnalysis {
  id: number
  stockId: number
  symbol: string
  companyName: string
  signal: Signal | string
  riskLevel: RiskLevel | string
  priceTrend: string
  fundamentalTrend: string
  newsImpact: string
  summary: string
  keyReasons: string[]
  confidence: number | null
  criticalAlert: boolean
}

export interface Report {
  id: number
  watchlistId: number
  watchlistName: string
  periodStart: string
  periodEnd: string
  generatedAt: string
  summary: string
  stocksAnalyzed: number
  triggerType: TriggerType | string
  analyses: StockAnalysis[]
}

export type AlertType =
  | 'PRICE_SPIKE'
  | 'PRICE_DROP'
  | 'WEEKLY_DECLINE'
  | 'MONTHLY_DECLINE'
  | 'VOLUME_SURGE'
  | 'NEGATIVE_EARNINGS'
  | 'REGULATORY_RISK'
  | 'FRAUD_GOVERNANCE'
  | 'DEBT_RISK'
  | 'MANAGEMENT_CHANGE'
  | 'FUNDAMENTAL_DETERIORATION'
  | string

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type AlertStatus = 'NEW' | 'READ' | 'RESOLVED'

export interface Alert {
  id: number
  stockId: number
  symbol: string
  companyName: string
  alertType: AlertType
  severity: Severity
  message: string
  createdAt: string
  status: AlertStatus
}

export interface ApiErrorBody {
  timestamp?: string
  status?: number
  error?: string
  message?: string
}

export interface HealthResponse {
  status: string
  components?: Record<string, { status: string; details?: Record<string, unknown> }>
}
