import { BehaviorSubject, Observable } from "rxjs"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

class ToastStore {
  private _toasts = new BehaviorSubject<Toast[]>([])
  public toasts$: Observable<Toast[]> = this._toasts.asObservable()

  show(toast: Omit<Toast, "id">): string {
    const id = crypto.randomUUID()
    const duration = toast.duration ?? 5000
    const newToast: Toast = { ...toast, id, duration }
    this._toasts.next([...this._toasts.value, newToast])

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration)
    }

    return id
  }

  success(title: string, message?: string): string {
    return this.show({ type: "success", title, message })
  }

  error(title: string, message?: string): string {
    return this.show({ type: "error", title, message, duration: 8000 })
  }

  warning(title: string, message?: string): string {
    return this.show({ type: "warning", title, message })
  }

  info(title: string, message?: string): string {
    return this.show({ type: "info", title, message })
  }

  dismiss(id: string): void {
    this._toasts.next(this._toasts.value.filter((t) => t.id !== id))
  }

  clearAll(): void {
    this._toasts.next([])
  }
}

export const toastStore = new ToastStore()
