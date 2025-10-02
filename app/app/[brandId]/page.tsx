'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, isSameDay } from 'date-fns';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface TimeSlot {
  start: string;
  end: string;
}

interface Brand {
  id: string;
  name: string;
  description?: string;
}

export default function BrandBookingPage() {
  const params = useParams();
  const brandId = params.brandId as string;

  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [selectedService, setSelectedService] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (brandId) {
      fetchBrand(brandId);
      fetchServices(brandId);
      fetchEmployees(brandId);
    }
  }, [brandId]);

  const fetchBrand = async (brandId: string) => {
    try {
      const res = await fetch('/api/config/brands');
      const data = await res.json();
      const foundBrand = data.brands.find((b: Brand) => b.id === brandId);
      if (foundBrand) {
        setBrand(foundBrand);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Error fetching brand:', error);
      setNotFound(true);
    }
  };

  const fetchServices = async (brandId: string) => {
    try {
      const res = await fetch(`/api/config/services?brandId=${brandId}`);
      const data = await res.json();
      setServices(data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchEmployees = async (brandId: string) => {
    try {
      const res = await fetch(`/api/config/employees?brandId=${brandId}`);
      const data = await res.json();
      setEmployees(data.employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Next 2 weeks

      const res = await fetch('/api/config/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService,
          brandId: brandId,
          employeeId: selectedEmployee,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const data = await res.json();
      setSlots(data.slots || []);
      setStep(2);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique dates that have availability
  const availableDates = useMemo(() => {
    const dates = slots.map(slot => startOfDay(new Date(slot.start)));
    const uniqueDates = Array.from(new Set(dates.map(d => d.getTime()))).map(t => new Date(t));
    return uniqueDates;
  }, [slots]);

  // Get slots for the selected date
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return slots.filter(slot => isSameDay(new Date(slot.start), selectedDate));
  }, [slots, selectedDate]);

  const createBooking = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    try {
      const res = await fetch('/api/config/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService,
          brandId: brandId,
          employeeId: selectedEmployee,
          customerName,
          customerEmail,
          customerPhone,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });

      if (res.ok) {
        setStep(4); // Success
      } else {
        alert('Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Brand Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">The requested booking calendar could not be found.</p>
              <a href="/" className="text-blue-600 hover:underline">
                Return to home page
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{brand.name}</h1>
        <p className="text-muted-foreground mb-8">Book a meeting with our team</p>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Service</CardTitle>
              <CardDescription>Choose a service and staff member</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="service">Service</Label>
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="employee">Staff Member</Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Select a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={fetchAvailability}
                disabled={!selectedService || !selectedEmployee || loading}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Find Available Times'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Select Date & Time</CardTitle>
              <CardDescription>Choose an available date from the calendar below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {slots.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No available slots found</p>
                  <p className="text-sm text-muted-foreground mt-2">Please try different selections</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        if (date < startOfDay(new Date())) return true;
                        return !availableDates.some(availDate => isSameDay(availDate, date));
                      }}
                      modifiers={{
                        available: availableDates,
                      }}
                      modifiersClassNames={{
                        available: 'bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-md',
                      }}
                      className="rounded-md border-0 shadow-sm"
                    />
                  </div>

                  {selectedDate && (
                    <div className="space-y-4 animate-in fade-in-50 duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {format(selectedDate, 'EEEE, MMMM d')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {slotsForSelectedDate.length} time slots available
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                        {slotsForSelectedDate.map((slot, index) => (
                          <Button
                            key={index}
                            variant={selectedSlot === slot ? 'default' : 'outline'}
                            className="h-12 font-medium transition-all hover:scale-105"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setStep(3);
                            }}
                          >
                            {format(new Date(slot.start), 'h:mm a')}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!selectedDate && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        Select a date from the calendar to see available time slots
                      </p>
                    </div>
                  )}
                </>
              )}
              <Button variant="ghost" onClick={() => setStep(1)} className="w-full mt-4">
                Back
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && selectedSlot && (
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>
                Selected: {format(new Date(selectedSlot.start), 'EEEE, MMMM d, yyyy - h:mm a')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+45 12 34 56 78"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={createBooking}
                  disabled={!customerName || !customerEmail || loading}
                  className="flex-1"
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Booking Confirmed!</CardTitle>
              <CardDescription>Your meeting has been scheduled</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                You will receive a calendar invitation at {customerEmail}
              </p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Make Another Booking
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
