import { createContext, useContext, useReducer } from "react";

// Create context for form state
const FormStateContext = createContext();

// Initialize form state reducer
function formStateReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        values: {
          ...state.values,
          [action.field]: action.value,
        },
        touched: {
          ...state.touched,
          [action.field]: true,
        },
        // Clear error when field is updated
        errors: {
          ...state.errors,
          [action.field]: undefined,
        },
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: {
          ...state.errors,
          ...action.errors,
        },
        // Mark fields with errors as touched
        touched: {
          ...state.touched,
          ...Object.keys(action.errors).reduce((acc, key) => {
            acc[key] = true;
            return acc;
          }, {}),
        },
      };

    case "SET_TOUCHED":
      return {
        ...state,
        touched: {
          ...state.touched,
          ...action.touched,
        },
      };

    case "RESET_FORM":
      return {
        ...state,
        values: action.values || state.initialValues,
        errors: {},
        touched: {},
      };

    default:
      return state;
  }
}

export function FormStateProvider({ children, initialValues = {} }) {
  const [state, dispatch] = useReducer(formStateReducer, {
    values: initialValues,
    errors: {},
    touched: {},
    initialValues,
  });

  const setValue = (field, value) => {
    dispatch({ type: "SET_FIELD", field, value });
  };

  const setErrors = (errors) => {
    dispatch({ type: "SET_ERRORS", errors });
  };

  const setTouched = (touched) => {
    dispatch({ type: "SET_TOUCHED", touched });
  };

  const resetForm = (values) => {
    dispatch({ type: "RESET_FORM", values });
  };

  return (
    <FormStateContext.Provider
      value={{
        values: state.values,
        errors: state.errors,
        touched: state.touched,
        setValue,
        setErrors,
        setTouched,
        resetForm,
      }}
    >
      {children}
    </FormStateContext.Provider>
  );
}

export const useFormState = () => {
  const context = useContext(FormStateContext);
  if (!context) {
    throw new Error("useFormState must be used within a FormStateProvider");
  }
  return context;
};
