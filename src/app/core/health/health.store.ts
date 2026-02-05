import { BehaviorSubject, Observable, interval } from 'rxjs'
import type { Subscription } from 'rxjs'
import { healthService } from './health.service'
import type { HealthCheck, HealthStatus } from './health.service'

export class HealthStore {
  private _health$ = new BehaviorSubject<HealthCheck>({
    status: 'checking',
    timestamp: Date.now(),
    apiAvailable: false,
  })

  private _isChecking$ = new BehaviorSubject<boolean>(false)

  public health$: Observable<HealthCheck> = this._health$.asObservable()
  public isChecking$: Observable<boolean> = this._isChecking$.asObservable()

  private intervalSubscription: Subscription | null = null

  async performHealthCheck(): Promise<void> {
    if (this._isChecking$.value) {
      return
    }

    this._isChecking$.next(true)

    try {
      const result = await healthService.checkHealth()
      this._health$.next(result)
    } catch {
      this._health$.next({
        status: 'unhealthy',
        timestamp: Date.now(),
        apiAvailable: false,
      })
    } finally {
      this._isChecking$.next(false)
    }
  }

  startPeriodicCheck(intervalMs = 30000): void {
    this.stopPeriodicCheck()
    
    this.performHealthCheck()

    this.intervalSubscription = interval(intervalMs).subscribe(() => {
      this.performHealthCheck()
    })
  }

  stopPeriodicCheck(): void {
    if (this.intervalSubscription) {
      this.intervalSubscription.unsubscribe()
      this.intervalSubscription = null
    }
  }

  getCurrentStatus(): HealthStatus {
    return this._health$.value.status
  }

  isHealthy(): boolean {
    return this._health$.value.status === 'healthy'
  }
}

export const healthStore = new HealthStore()
