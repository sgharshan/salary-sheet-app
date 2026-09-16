import { NavLink } from 'react-router-dom'
import Modal from '../ui/Modal'
import Icon from '../ui/Icon'
import { navigation } from './navigation'

interface Props {
  open: boolean
  onClose: () => void
  onLogPayout: () => void
}

export default function HamburgerMenu({ open, onClose, onLogPayout }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Navigation">
      <nav aria-label="Mobile navigation" className="space-y-2">
        {navigation.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose} className="nav-link !min-h-14"><Icon name={item.icon} />{item.label}</NavLink>)}
      </nav>
      <div className="mt-5 border-t border-[#292929] pt-5">
        <button onClick={() => { onClose(); onLogPayout() }} className="button-secondary w-full"><Icon name="wallet" />Log Payout</button>
      </div>
    </Modal>
  )
}
