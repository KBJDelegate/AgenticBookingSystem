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
import { Separator } from '@/components/ui/separator';
import { format, startOfDay, isSameDay } from 'date-fns';
import { CalendarIcon, Clock, User } from 'lucide-react';

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
  availableStaffEmails?: string[];
}

interface Brand {
  id: string;
  name: string;
  description?: string;
}

export default function BrandBookingPage() {
  const params = useParams();
  const brandId = params.brandId as string;

  const [brand, setBrand] = useState<Brand | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  useEffect(() => {
    if (selectedService && selectedEmployee && brandId) {
      fetchAvailability();
    }
  }, [selectedService, selectedEmployee]);

  const fetchBrand = async (brandId: string) => {
    try {
      const res = await fetch(`/api/calendar/brands?brandId=${brandId}`);
      if (res.ok) {
        const data = await res.json();
        setBrand(data);
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
      const res = await fetch(`/api/calendar/services?brandId=${brandId}`);
      const data = await res.json();
      setServices(data.services);
      // Auto-select first service if only one exists
      if (data.services.length === 1) {
        setSelectedService(data.services[0].id);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchEmployees = async (brandId: string) => {
    try {
      const res = await fetch(`/api/calendar/employees?brandId=${brandId}`);
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
      endDate.setDate(endDate.getDate() + 60); // Next 60 days

      const res = await fetch('/api/calendar/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brandId,
          serviceId: selectedService,
          employeeId: selectedEmployee,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const data = await res.json();
      setSlots(data.slots || []);
      // Auto-select the first available date
      if (data.slots && data.slots.length > 0) {
        const firstSlotDate = startOfDay(new Date(data.slots[0].start));
        setSelectedDate(firstSlotDate);
      }
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
      const res = await fetch('/api/calendar/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brandId,
          serviceId: selectedService,
          employeeId: selectedEmployee,
          customerName,
          customerEmail,
          customerPhone,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log('Booking created:', data.bookingId);
        setBookingSuccess(true);
        // Reset form after 5 seconds
        setTimeout(() => {
          setBookingSuccess(false);
          setSelectedSlot(null);
          setCustomerName('');
          setCustomerEmail('');
          setCustomerPhone('');
        }, 5000);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceDetails = services.find(s => s.id === selectedService);

  if (notFound) {
    return (
      <div className="min-h-screen p-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Booking ikke fundet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Den ønskede booking kalender kunne ikke findes.</p>
              <a href="/" className="text-blue-600 hover:underline">
                Tilbage til forsiden
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen p-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <p>Indlæser...</p>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">Booking bekræftet!</CardTitle>
            <CardDescription>
              Din tid er blevet reserveret
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              Du vil modtage en kalenderinvitation på {customerEmail}
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Lav en ny booking
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            {/* Logo placeholder - you can add actual logo here */}
            <div className="text-red-600 font-bold text-3xl">ii</div>
            <div>
              <h1 className="text-2xl font-semibold">{brand.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Service and Staff Selection */}
        <Card className="mb-6 border-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-red-600 rounded-full"></div>
              <CardTitle className="text-lg">
                {selectedServiceDetails ? selectedServiceDetails.name : 'Vælg service'}
              </CardTitle>
            </div>
            <CardDescription>
              {selectedServiceDetails ? `${selectedServiceDetails.duration} minutter` : 'Vælg service og medarbejder nedenfor'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.length > 1 ? (
              <div>
                <Label htmlFor="service">Service</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Vælg service" />
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
            ) : null}

            <div>
              <Label htmlFor="employee">Medarbejder</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Vælg medarbejder" />
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
          </CardContent>
        </Card>

        {/* Booking Section */}
        {selectedService && selectedEmployee && (
          <>
            <h2 className="text-xl font-semibold mb-6">
              Booking for {selectedServiceDetails?.name}
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column - Calendar */}
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    DATO
                  </h3>
                  <Separator />
                </div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <p className="text-gray-500">Indlæser ledige tider...</p>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Ingen ledige tider fundet</p>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        if (date < startOfDay(new Date())) return true;
                        return !availableDates.some(availDate => isSameDay(availDate, date));
                      }}
                      className="rounded-md"
                    />
                  </div>
                )}
              </div>

              {/* Right Column - Time slots and form */}
              <div className="space-y-6">
                {/* Time Slots */}
                {selectedDate && slotsForSelectedDate.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      TIDSPUNKT
                    </h3>
                    <Separator className="mb-4" />
                    <div className="flex flex-wrap gap-2">
                      {slotsForSelectedDate.map((slot, index) => (
                        <Button
                          key={index}
                          variant={selectedSlot === slot ? 'default' : 'outline'}
                          className={`px-4 py-2 ${
                            selectedSlot === slot
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'hover:border-red-600 hover:text-red-600'
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {format(new Date(slot.start), 'HH:mm')}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Information Form */}
                {selectedSlot && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      TILFØJ DINE OPLYSNINGER
                    </h3>
                    <Separator />

                    <div>
                      <Label htmlFor="name">Fornavn og efternavn *</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Fornavn og efternavn"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Mail"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefonnummer *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Tilføj dit telefonnummer"
                        className="mt-1"
                      />
                    </div>

                    <Button
                      onClick={createBooking}
                      disabled={!customerName || !customerEmail || loading}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-lg"
                    >
                      {loading ? 'Reserverer...' : 'Reservér'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}