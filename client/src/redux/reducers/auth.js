import {
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT,
  DELETE_ACCOUNT
} from '../actions/types';

const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: null,
  loading: true,
  user: null
}

export default function(state = initialState, action) {
  switch (action.type) {
    case REGISTER_SUCCESS:
    case LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state, ...action.payload, isAuthenticated: true, loading: false
      }
      case REGISTER_FAILURE:
      case AUTH_ERROR:
      case LOGIN_FAILURE:
      case LOGOUT:
      case DELETE_ACCOUNT:
        localStorage.removeItem('token');
        return {
          ...state, token: null, isAuthenticated: false, loading: false
        }
        case USER_LOADED:
          return {
            ...state, isAuthenticated: true, loading: false, user: action.payload
          }
          default:
            return state;
  }
}
