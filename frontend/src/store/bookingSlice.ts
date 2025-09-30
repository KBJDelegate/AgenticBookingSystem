import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface BookingState {
  currentStep: number;
  formData: any;
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  currentStep: 0,
  formData: {},
  loading: false,
  error: null
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    updateFormData: (state, action: PayloadAction<any>) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetBooking: (state) => {
      state.currentStep = 0;
      state.formData = {};
      state.loading = false;
      state.error = null;
    }
  }
});

export const { setCurrentStep, updateFormData, setLoading, setError, resetBooking } = bookingSlice.actions;
export default bookingSlice.reducer;