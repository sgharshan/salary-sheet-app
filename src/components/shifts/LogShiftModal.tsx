import Modal from '../ui/Modal'
interface Props { open: boolean; onClose: () => void }
export default function LogShiftModal({ open, onClose }: Props) {
  return <Modal open={open} onClose={onClose} title="Log Shift"><div className="text-[#888] text-sm py-8 text-center">Coming soon</div></Modal>
}
