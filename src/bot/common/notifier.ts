export interface Notifier {
  type: string
  sendMessage: (message: string) => Promise<number>
}
