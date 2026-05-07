import Modal from '../ui/Modal'
interface Props { open: boolean; onClose: () => void }
export default function LogPayoutModal({ open, onClose }: Props) {
  return <Modal open={open} onClose={onClose} title="Log Payout"><div className="text-[#888] text-sm py-8 text-center">Coming soon</div></Modal>
}
