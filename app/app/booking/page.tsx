'use client';

import { useState, useEffect } from 'react';
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
import { format } from 'date-fns';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
}

interface Brand {
  id: string;
  name: string;
  description?: string;
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

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedService, setSelectedService] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchServices(selectedBrand);
      fetchEmployees(selectedBrand);
    }
  }, [selectedBrand]);

  const fetchServices = async (brandId: string) => {
    try {
      const res = await fetch(`/api/config/services?brandId=${brandId}`);
      const data = await res.json();
      setServices(data.services);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/config/brands');
      const data = await res.json();
      setBrands(data.brands);
    } catch (error) {
      console.error('Error fetching brands:', error);
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
          brandId: selectedBrand,
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

  const createBooking = async () => {
    if (!selectedSlot) return;

    setLoading(true);
    try {
      const res = await fetch('/api/config/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService,
          brandId: selectedBrand,
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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Book a Meeting</h1>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Calendar and Service</CardTitle>
              <CardDescription>Choose your booking calendar first</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brand">Booking Calendar</Label>
                <Select value={selectedBrand} onValueChange={(value) => {
                  setSelectedBrand(value);
                  setSelectedService('');
                  setSelectedEmployee('');
                  setServices([]);
                  setEmployees([]);
                }}>
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Select a calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service">Service</Label>
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                  disabled={!selectedBrand}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder={!selectedBrand ? "Select a calendar first" : "Select a service"} />
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
                  disabled={!selectedBrand}
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder={!selectedBrand ? "Select a calendar first" : "Select a staff member"} />
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
                disabled={!selectedService || !selectedBrand || !selectedEmployee || loading}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Find Available Times'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Time</CardTitle>
              <CardDescription>Choose an available time slot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {slots.length === 0 ? (
                  <p className="text-gray-500">No available slots found</p>
                ) : (
                  slots.slice(0, 20).map((slot, index) => (
                    <Button
                      key={index}
                      variant={selectedSlot === slot ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep(3);
                      }}
                    >
                      {format(new Date(slot.start), 'EEEE, MMMM d, yyyy - h:mm a')}
                    </Button>
                  ))
                )}
              </div>
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
