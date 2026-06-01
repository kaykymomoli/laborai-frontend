import { Navigate } from 'react-router-dom'
import useStore from '../store/useStore'

export default function PrivateRoute({ children }) {
  const token = useStore(state => state.authToken)
  return token ? children : <Navigate to="/login" />
}