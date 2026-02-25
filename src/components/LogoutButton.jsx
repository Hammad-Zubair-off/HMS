import { useAuth } from '../hooks/useAuth'
import { FaArrowRightFromBracket } from 'react-icons/fa6'

export default function LogoutButton() {
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="btn-outline rounded-lg btn-md flex"
    >
      <FaArrowRightFromBracket className="icon-sm mr-2" />
      Logout
    </button>
  )
}
