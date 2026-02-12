import { Switch as RouteSwitch, Route, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  menuQueryOptions, ordersQueryOptions, customerOrdersQueryOptions,
  settingsQueryOptions, bannersQueryOptions, categoriesQueryOptions,
  customersQueryOptions, apiPost, apiPatch, apiDelete
} from "@/lib/api";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Home, ShoppingBag, Store, ListOrdered, Settings, Plus, Minus, Trash2, MapPin, CheckCircle, XCircle, ChevronRight, Upload, Phone, ArrowRight, User, Users, FileText, HelpCircle, LogOut, Utensils, IndianRupee, Image as ImageIcon, Search, FileSpreadsheet, Download, Shield, RefreshCcw, Ban, Check, Eye, EyeOff, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import monishaHero from "@/assets/monisha-hero.png";
import splashVideo from "@/assets/splash-animation.mp4";
import * as XLSX from "xlsx";
import { setupRecaptcha, sendOtp, compressAndUploadImage } from "@/lib/firebase";
import type { ConfirmationResult } from "firebase/auth";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// --- Helpers ---

import { Switch } from "@/components/ui/switch";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function DishCard({ item, handleAddToCart }: { item: any; handleAddToCart: (id: number, increment?: boolean) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cart = useStore((state) => state.cart);
  const cartItem = cart.find(c => c.itemId === item.id);
  const quantity = cartItem?.quantity || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-3 shadow-md border border-orange-100/60 flex gap-4 overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="relative shrink-0">
        <div className="w-28 h-28 rounded-xl bg-orange-50 overflow-hidden">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
        
        {quantity > 0 ? (
           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-8 flex items-center shadow-md bg-primary rounded-lg overflow-hidden">
             <button 
               className="h-full px-2 hover:bg-white/10 text-white flex items-center justify-center"
               onClick={(e) => { e.stopPropagation(); handleAddToCart(item.id, false); }}
             >
               <Minus className="w-3 h-3 font-bold" />
             </button>
             <span className="text-xs font-bold w-6 text-center text-white">{quantity}</span>
             <button 
               className="h-full px-2 hover:bg-white/10 text-white flex items-center justify-center"
               onClick={(e) => { e.stopPropagation(); handleAddToCart(item.id, true); }}
             >
               <Plus className="w-3 h-3 font-bold" />
             </button>
           </div>
        ) : (
          <Button 
            size="sm" 
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-8 px-6 shadow-md bg-primary text-white hover:bg-primary/90 font-bold border-none uppercase text-xs"
            onClick={(e) => { e.stopPropagation(); handleAddToCart(item.id, true); }}
          >
            ADD
          </Button>
        )}
      </div>
      <div className="flex-1 py-1 min-w-0 flex flex-col">
        <div className="flex justify-between items-start">
          <div className={cn("w-4 h-4 rounded-sm border flex items-center justify-center p-[2px]", item.isVeg ? "border-green-600" : "border-red-600")}>
            <div className={cn("w-full h-full rounded-full", item.isVeg ? "bg-green-600" : "bg-red-600")}></div>
          </div>
        </div>
        <h3 className="font-bold text-foreground mt-1 line-clamp-1">{item.name}</h3>
        <p className="text-sm font-bold text-primary mt-2">₹{item.price}</p>
        
        <div className="relative mt-1">
          <p className={cn("text-xs text-muted-foreground leading-relaxed", !isExpanded && "line-clamp-2")}>
            {item.description}
          </p>
          {item.description && item.description.length > 60 && (
             <button 
               onClick={() => setIsExpanded(!isExpanded)} 
               className="text-[10px] font-bold text-primary/70 hover:text-primary mt-0.5 flex items-center gap-0.5"
             >
               {isExpanded ? "Show less" : "More"}
               <ChevronRight className={cn("w-3 h-3 transition-transform", isExpanded ? "-rotate-90" : "rotate-90")} />
             </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- Map Components ---

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
}

function StoreLocationPicker({ open, onClose, initialLat, initialLng, radiusKm, onSave }: {
  open: boolean;
  onClose: () => void;
  initialLat: number;
  initialLng: number;
  radiusKm: number;
  onSave: (lat: number, lng: number, radius: number) => void;
}) {
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);
  const [radius, setRadius] = useState(radiusKm);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result: any) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    setLat(newLat);
    setLng(newLng);
    setFlyTarget({ lat: newLat, lng: newLng });
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",").slice(0, 3).join(","));
  };

  const handleMapClick = (clickLat: number, clickLng: number) => {
    setLat(clickLat);
    setLng(clickLng);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(lat, lng, radius);
    setSaving(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" /> Set Store Location
          </h2>
          <p className="text-sm text-foreground/60 mt-1">Search your shop address or tap the map to pin your location.</p>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              data-testid="input-store-location-search"
              placeholder="Search address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button size="sm" onClick={handleSearch} disabled={searching}>
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg max-h-40 overflow-y-auto">
              {searchResults.map((result: any, i: number) => (
                <button
                  key={i}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-orange-100 border-b last:border-b-0 transition-colors"
                  onClick={() => handleSelectResult(result)}
                >
                  <span className="line-clamp-2">{result.display_name}</span>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-xl overflow-hidden border h-[280px]">
            <MapContainer center={[lat, lng]} zoom={15} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[lat, lng]} />
              <Circle center={[lat, lng]} radius={radius * 1000} pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.1 }} />
              <MapClickHandler onMapClick={handleMapClick} />
              {flyTarget && <FlyToLocation lat={flyTarget.lat} lng={flyTarget.lng} />}
            </MapContainer>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium whitespace-nowrap">Delivery Radius</Label>
            <Input
              data-testid="input-delivery-radius"
              type="number"
              min={1}
              max={50}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-foreground/60">km</span>
          </div>

          <div className="bg-orange-50 rounded-lg p-3 text-xs text-foreground/70 space-y-1">
            <p><span className="font-medium">Lat:</span> {lat.toFixed(6)}, <span className="font-medium">Lng:</span> {lng.toFixed(6)}</p>
            <p className="text-green-600 font-medium">Green circle = delivery zone ({radius} km)</p>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Location"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Components ---

function ProfileSetupPage() {
  const { user, updateProfile } = useStore();
  const { data: settings, isLoading } = useQuery(settingsQueryOptions);
  const [name, setName] = useState(user?.name || "");
  const [address, setAddress] = useState(user?.address || "");
  const [location, setLocationState] = useState(user?.location);
  const { toast } = useToast();
  const setLocation = useLocation()[1];
  
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not Supported", description: "Your browser does not support location detection.", variant: "destructive" });
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationState({ lat: position.coords.latitude, lng: position.coords.longitude });
        setDetectingLocation(false);
        toast({ title: "Location Detected", description: "Your real location has been set." });
      },
      (error) => {
        setDetectingLocation(false);
        let msg = "Unable to detect your location.";
        if (error.code === error.PERMISSION_DENIED) msg = "Location permission denied. Please allow location access in your browser settings.";
        else if (error.code === error.POSITION_UNAVAILABLE) msg = "Location unavailable. Please try again.";
        else if (error.code === error.TIMEOUT) msg = "Location request timed out. Please try again.";
        toast({ title: "Location Error", description: msg, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = () => {
    if (!name || !address || !location) {
      toast({ title: "Missing Information", description: "Please fill all details and set location.", variant: "destructive" });
      return;
    }
    
    updateProfile({ name, address, location });
    
    if (user?.phoneNumber) {
      apiPost("/api/customers", {
        phoneNumber: user.phoneNumber,
        name,
        address,
        locationLat: location.lat,
        locationLng: location.lng,
      }).catch(() => {});
    }
    
    toast({ title: "Profile Saved", description: "You are ready to order!" });
    setLocation("/");
  };

  if (isLoading) return <LoadingSpinner />;

  const isEditing = !!(user?.name && user?.address);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 flex flex-col p-6 space-y-6 overflow-y-auto">
      <div className="text-center space-y-2 pt-8">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
           <User className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-primary">{isEditing ? "Edit Profile" : "Complete Your Profile"}</h1>
        <p className="text-muted-foreground text-sm">{isEditing ? "Update your delivery details below." : "Please provide your details for delivery."}</p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Delivery Address</Label>
            <Textarea placeholder="House no, Street, Landmark..." value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="p-4 bg-orange-50 rounded-lg border border-dashed border-orange-200 flex items-center justify-between">
               <div className="flex items-center gap-2 text-sm text-foreground/70">
                 <MapPin className="w-4 h-4 text-primary" />
                 {location ? <span className="text-green-600 font-medium">Location Set</span> : <span>Location not set</span>}
               </div>
               <Button size="sm" variant="outline" onClick={handleGetLocation} disabled={detectingLocation}>
                 {detectingLocation ? "Detecting..." : location ? "Update" : "Detect"}
               </Button>
            </div>
            <p className="text-xs text-muted-foreground">We need your location to check delivery availability.</p>
          </div>
        </CardContent>
      </Card>

      <Button size="lg" className="w-full font-bold" onClick={handleSave}>
        {isEditing ? "Update Profile" : "Save & Continue"}
      </Button>
    </div>
  );
}

function LoginPage() {
  const login = useStore((state) => state.login);
  const merchantLogin = useStore((state) => state.merchantLogin);
  const [step, setStep] = useState<"phone" | "otp" | "merchant">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [merchantUsername, setMerchantUsername] = useState("");
  const [merchantPassword, setMerchantPassword] = useState("");
  const [showMerchantPassword, setShowMerchantPassword] = useState(false);
  const [merchantLoggingIn, setMerchantLoggingIn] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleMerchantLogin = async () => {
    if (!merchantUsername || !merchantPassword) {
      toast({ title: "Enter credentials", description: "Please enter username and password", variant: "destructive" });
      return;
    }
    setMerchantLoggingIn(true);
    try {
      const res = await fetch("/api/merchant/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: merchantUsername, password: merchantPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        merchantLogin(data.token);
        toast({ title: "Welcome!", description: "Merchant dashboard access granted" });
      } else {
        toast({ title: "Login Failed", description: "Invalid username or password", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setMerchantLoggingIn(false);
    }
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid 10-digit number", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const verifier = setupRecaptcha("recaptcha-container");
      const result = await sendOtp(phoneNumber, verifier);
      setConfirmationResult(result);
      setStep("otp");
      toast({ title: "OTP Sent", description: "Please check your SMS for the verification code" });
    } catch (error: any) {
      console.error("OTP error:", error);
      toast({ title: "Failed to send OTP", description: error?.message || "Please try again", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const updateProfile = useStore((state) => state.updateProfile);

  const detectAndSetLocation = (phone: string) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          const currentUser = useStore.getState().user;
          if (currentUser) {
            updateProfile({ name: currentUser.name || "", address: currentUser.address || "", location: loc });
          }
          apiPost("/api/customers", { phoneNumber: phone, locationLat: loc.lat, locationLng: loc.lng }).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || otp.length < 6) {
      toast({ title: "Enter OTP", description: "Please enter the 6-digit code sent to your phone", variant: "destructive" });
      return;
    }
    setVerifying(true);
    try {
      await confirmationResult.confirm(otp);
      await apiPost("/api/customers", { phoneNumber }).catch(() => {});
      try {
        const res = await fetch(`/api/customers/${phoneNumber}`);
        if (res.ok) {
          const customer = await res.json();
          if (customer.name && customer.address) {
            login(phoneNumber);
            updateProfile({
              name: customer.name,
              address: customer.address,
              location: customer.locationLat && customer.locationLng ? { lat: customer.locationLat, lng: customer.locationLng } : undefined,
            });
            detectAndSetLocation(phoneNumber);
            toast({ title: "Welcome back!", description: `Good to see you again, ${customer.name}!` });
            return;
          }
        }
      } catch {}
      login(phoneNumber);
      detectAndSetLocation(phoneNumber);
      toast({ title: "Login Successful", description: "Please complete your profile to start ordering." });
    } catch (error: any) {
      console.error("Verify error:", error);
      toast({ title: "Invalid OTP", description: "The code you entered is incorrect. Please try again.", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans">
      <img
        src="/assets/login-bg.gif"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full"
        >
          <div className="bg-black/50 backdrop-blur-lg border border-white/15 shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <AnimatePresence mode="wait">
                {step === "phone" ? (
                  <motion.div
                    key="phone"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-3">
                      <h3 className="text-white text-lg font-semibold">Welcome</h3>
                      <p className="text-white/50 text-xs mt-1">Enter your mobile number to continue</p>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex items-center justify-center px-3 border border-[#FFD700]/30 rounded-xl bg-[#FFD700]/10 text-[#FFD700] font-semibold text-sm">
                        +91
                      </div>
                      <Input 
                        placeholder="Mobile Number" 
                        type="tel" 
                        maxLength={10}
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 bg-white/10 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-[#FFD700]/50 focus-visible:border-[#FFD700]/30 h-12 rounded-xl text-lg tracking-widest"
                      />
                    </div>
                    <Button 
                      className="w-full font-bold h-12 bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#FFD700] text-[#5C0000] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] shadow-lg rounded-xl uppercase tracking-wider text-sm" 
                      onClick={handleSendOtp}
                      disabled={sending}
                    >
                      {sending ? "Sending..." : "Get OTP"}
                    </Button>
                    <div id="recaptcha-container"></div>
                  </motion.div>
                ) : step === "otp" ? (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-2">
                      <h3 className="text-white text-lg font-semibold">Verification Code</h3>
                      <p className="text-xs text-white/50 mt-1">Sent to +91 {phoneNumber}</p>
                    </div>
                    
                    <div className="flex justify-center py-2">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup className="gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot 
                              key={i} 
                              index={i} 
                              className="bg-white/10 border border-white/20 text-[#FFD700] h-12 w-10 text-lg font-bold rounded-xl focus:border-[#FFD700]/50 focus:ring-1 focus:ring-[#FFD700]/30"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <Button 
                      className="w-full font-bold h-12 bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#FFD700] text-[#5C0000] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] shadow-lg rounded-xl uppercase tracking-wider text-sm" 
                      onClick={handleVerifyOtp}
                      disabled={verifying}
                    >
                      {verifying ? "Verifying..." : "Verify & Login"}
                    </Button>
                    <Button variant="ghost" className="w-full text-white/40 hover:text-white/60 h-auto p-0 text-xs" onClick={() => setStep("phone")}>
                      Change Mobile Number
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="merchant"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="text-center mb-2">
                      <h3 className="text-white text-lg font-semibold">Merchant Login</h3>
                      <p className="text-white/50 text-xs mt-1">Access your dashboard</p>
                    </div>
                    <div className="space-y-3">
                      <Input
                        data-testid="input-merchant-username"
                        placeholder="Username"
                        value={merchantUsername}
                        onChange={(e) => setMerchantUsername(e.target.value)}
                        className="bg-white/10 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-[#FFD700]/50 focus-visible:border-[#FFD700]/30 h-12 rounded-xl"
                      />
                      <div className="relative">
                        <Input
                          data-testid="input-merchant-password"
                          placeholder="Password"
                          type={showMerchantPassword ? "text" : "password"}
                          value={merchantPassword}
                          onChange={(e) => setMerchantPassword(e.target.value)}
                          className="bg-white/10 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-[#FFD700]/50 focus-visible:border-[#FFD700]/30 h-12 rounded-xl pr-12"
                        />
                        <button
                          type="button"
                          data-testid="button-toggle-password"
                          onClick={() => setShowMerchantPassword(!showMerchantPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-[#FFD700]"
                        >
                          {showMerchantPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <Button
                      data-testid="button-merchant-submit"
                      className="w-full font-bold h-12 bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#FFD700] text-[#5C0000] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] shadow-lg rounded-xl uppercase tracking-wider text-sm"
                      onClick={handleMerchantLogin}
                      disabled={merchantLoggingIn}
                    >
                      {merchantLoggingIn ? "Logging in..." : "Login"}
                    </Button>
                    <Button variant="ghost" className="w-full text-white/40 hover:text-white/60 h-auto p-0 text-xs" onClick={() => setStep("phone")}>
                      Back to Customer Login
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </div>
        </motion.div>

        {step !== "merchant" && (
          <button
            data-testid="button-merchant-login"
            onClick={() => setStep("merchant")}
            className="mt-4 text-white/40 hover:text-white/70 text-xs flex items-center gap-1.5 transition-colors"
          >
            <Store className="w-3 h-3" /> Merchant Login
          </button>
        )}

        <p className="mt-3 text-white/25 text-[10px] tracking-wider">FSSAI: 20119038001047</p>
      </div>
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="w-full max-w-2xl mx-auto relative min-h-screen flex flex-col">
        <div className="flex-1 relative">
          {children}
        </div>
      </div>
    </div>
  );
}

function BottomNav() {
  const [location, setLocation] = useLocation();
  const cart = useStore((state) => state.cart);
  const { data: menu = [] } = useQuery(menuQueryOptions);
  
  const validCartItems = cart.filter(c => menu.some((m: any) => m.id === c.itemId));
  const cartCount = validCartItems.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Utensils, label: "Menu", path: "/menu" },
    { icon: ListOrdered, label: "Orders", path: "/orders" },
    { icon: ShoppingBag, label: "Cart", path: "/cart", badge: cartCount },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-orange-100 px-4 py-3 flex justify-around items-center z-50 pb-[env(safe-area-inset-bottom,8px)] max-w-2xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={() => setLocation(item.path)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all relative min-w-[50px]",
            location === item.path ? "text-primary scale-105" : "text-muted-foreground hover:text-primary/70"
          )}
        >
          <div className="relative">
            <item.icon className={cn("w-6 h-6", location === item.path && "fill-current")} />
            {item.badge ? (
              <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] flex justify-center animate-pulse">
                {item.badge}
              </span>
            ) : null}
          </div>
          <span className={cn("text-[10px] font-semibold", location === item.path && "text-primary")}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function MerchantNav() {
  const [location, setLocation] = useLocation();
  
  const navItems = [
    { icon: ListOrdered, label: "Orders", path: "/merchant" },
    { icon: Users, label: "Customers", path: "/merchant/customers" },
    { icon: Store, label: "Menu", path: "/merchant/menu" },
    { icon: Settings, label: "Settings", path: "/merchant/settings" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-3 flex justify-around items-center z-50 pb-[env(safe-area-inset-bottom,8px)] max-w-2xl mx-auto">
      {navItems.map((item) => (
        <button
          key={item.label}
          onClick={() => setLocation(item.path)}
          className={cn(
            "flex flex-col items-center gap-1 transition-colors opacity-60 hover:opacity-100",
            location === item.path && "opacity-100 text-primary"
          )}
        >
          <item.icon className={cn("w-6 h-6", location === item.path && "fill-current")} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// --- Pages: Customer ---

function CustomerHome() {
  const { data: menu = [], isLoading: menuLoading } = useQuery(menuQueryOptions);
  const { data: categoriesData = [], isLoading: catLoading } = useQuery(categoriesQueryOptions);
  const { data: settings, isLoading: settingsLoading } = useQuery(settingsQueryOptions);
  const { data: banners = [], isLoading: bannersLoading } = useQuery(bannersQueryOptions);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const user = useStore((state) => state.user);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const setLocation = useLocation()[1];

  const categoryImages: Record<string, string> = {};
  const visibleCategories: string[] = [];
  categoriesData.forEach((c: any) => {
    if (c.image) categoryImages[c.category] = c.image;
    if (c.visible) visibleCategories.push(c.category);
  });

  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const isLoading = menuLoading || settingsLoading || bannersLoading;
  if (isLoading || !settings) return <LoadingSpinner />;

  const filteredMenu = menu.filter((item: any) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allCategories = Array.from(new Set(menu.map((item: any) => item.category)));
  
  let displayedCategories = allCategories.filter(c => visibleCategories.includes(c));
  
  if (displayedCategories.length === 0 && visibleCategories.length === 0) {
     displayedCategories = allCategories.slice(0, 8);
  }

  const showMoreButton = displayedCategories.length > 8 || (visibleCategories.length > 0 && visibleCategories.length < allCategories.length && allCategories.length > 8) || allCategories.length > 8;
  
  const finalDisplay = showMoreButton ? displayedCategories.slice(0, 7) : displayedCategories.slice(0, 8);

  const handleAddToCart = (id: number, increment: boolean = true) => {
    const currentUser = useStore.getState().user;
    if (currentUser?.isBlocked) {
        toast({ 
          title: "Account Blocked", 
          description: "Your account has been restricted. Please contact support.", 
          variant: "destructive" 
        });
        return;
    }

    if (!settings.isOpen) {
       if (settings.openTime) {
         const now = new Date();
         const [openHour, openMinute] = settings.openTime.split(':').map(Number);
         
         const openDate = new Date();
         openDate.setHours(openHour, openMinute, 0, 0);
         
         if (now > openDate) {
           openDate.setDate(openDate.getDate() + 1);
         }
         
         const diffMs = openDate.getTime() - now.getTime();
         const diffMins = diffMs / (1000 * 60);
         
         if (diffMins <= 30 && diffMins > 0) {
            if (increment) {
              addToCart(id);
              toast({
                title: "Pre-order Accepted",
                description: "Shop will start preparing the order in 30 mins. Thank you for your order!",
                className: "bg-green-600 text-white border-none",
              });
            } else {
              removeFromCart(id);
            }
            return;
         }
       }

       toast({
         title: "Store Closed",
         description: settings.nextOpenMessage || `We open at ${settings.openTime}`,
         variant: "destructive",
       });
       return;
    }
    
    if (increment) {
      addToCart(id);
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart",
        duration: 1500,
      });
    } else {
      removeFromCart(id);
    }
  };

  return (
    <div className="min-h-screen overflow-y-auto pb-20 bg-gradient-to-b from-orange-50/80 to-amber-50/40">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 p-4 sticky top-0 z-30 shadow-lg space-y-3 text-white">
        {!settings.isOpen && (
           <div className="bg-red-700/80 text-white text-xs font-bold py-2 px-4 -mx-4 -mt-4 mb-2 flex items-center justify-center gap-2 backdrop-blur-sm">
              <LogOut className="w-3 h-3" />
              <span>STORE CLOSED {settings.nextOpenMessage ? `- ${settings.nextOpenMessage}` : `- Opens at ${settings.openTime}`}</span>
           </div>
        )}
        <div>
          <div className="flex items-center gap-2 text-white/80 mb-1">
            <MapPin className="w-4 h-4 fill-current" />
            <span className="text-xs font-bold tracking-wider uppercase">Current Location</span>
          </div>
          <h1 className="text-xl font-heading font-bold leading-tight line-clamp-1 text-white" onClick={() => setLocation("/profile-setup")}>
            {user?.address ? user.address : "Set your location"}
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-900/40" />
          <Input 
            className="pl-9 bg-white/90 border-none text-foreground placeholder:text-orange-900/40 rounded-xl" 
            placeholder="Search for dishes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {searchQuery ? (
        <div className="px-4 pt-4">
           <h2 className="font-heading font-bold text-lg mb-3">Search Results</h2>
           <div className="space-y-4">
             {filteredMenu.length > 0 ? (
               filteredMenu.map((item: any) => (
                <DishCard key={item.id} item={item} handleAddToCart={handleAddToCart} />
               ))
             ) : (
               <div className="text-center py-10 text-muted-foreground">
                 <p>No items found matching "{searchQuery}"</p>
               </div>
             )}
           </div>
        </div>
      ) : (
        <>
          {/* Banners - Carousel */}
          {banners.length > 0 && (
          <div className="p-4 pt-2">
            <div className="relative w-full h-44 sm:h-56 overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBannerIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => {
                    const banner = banners[currentBannerIndex];
                    if (banner.linkedItemIds && banner.linkedItemIds.length > 0) {
                      setLocation(`/banner/${banner.id}`);
                    }
                  }}
                  className={cn(
                    "absolute inset-0 w-full h-full flex items-center text-white bg-gradient-to-r cursor-pointer overflow-hidden",
                    banners[currentBannerIndex]?.gradient
                  )}
                >
                  {banners[currentBannerIndex]?.image ? (
                    <>
                      <img 
                        src={banners[currentBannerIndex].image} 
                        alt={banners[currentBannerIndex].title} 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                      <div className="absolute inset-0 bg-black/30 z-10" />
                    </>
                  ) : (
                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl z-0"></div>
                  )}
                  
                  <div className="relative z-20 p-6 max-w-[65%]">
                  </div>
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                    {banners.map((_: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-all", 
                          idx === currentBannerIndex ? "bg-white w-3" : "bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          )}

          {/* Categories Dynamic */}
          <div className="px-4 mb-6">
            <div className="flex justify-between items-center mb-3">
               <h2 className="font-heading font-bold text-lg">Category</h2>
               {showMoreButton && (
                 <Button variant="link" className="text-primary text-xs h-auto p-0" onClick={() => setLocation("/categories")}>
                   View All
                 </Button>
               )}
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
              {finalDisplay.map((cat) => (
                <div key={cat} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => setLocation(`/category/${encodeURIComponent(cat)}`)}>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-md border-2 border-orange-200/60 flex items-center justify-center overflow-hidden group-hover:border-primary group-hover:shadow-lg transition-all">
                    {categoryImages[cat] ? (
                      <img src={categoryImages[cat]} alt={cat} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-[10px] text-primary/70 font-medium text-center p-1 break-words line-clamp-2">{cat}</div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-foreground/70 text-center line-clamp-1 w-full">{cat}</span>
                </div>
              ))}
              
              {showMoreButton && (
                <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setLocation("/categories")}>
                  <div className="w-16 h-16 rounded-full bg-primary/10 shadow-sm border border-primary/20 flex items-center justify-center overflow-hidden">
                     <ArrowRight className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-foreground/70 text-center line-clamp-1 w-full">More</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu List */}
          <div className="px-4">
            <h2 className="font-heading font-bold text-lg mb-3">Recommended for you</h2>
            <div className="space-y-4">
              {menu.map((item: any) => (
                <DishCard key={item.id} item={item} handleAddToCart={handleAddToCart} />
              ))}
            </div>
          </div>
        </>
      )}
      <BottomNav />
    </div>
  );
}

function CustomerCart() {
  const { cart, addToCart, removeFromCart, clearCart, user } = useStore();
  const { data: menu = [], isLoading: menuLoading } = useQuery(menuQueryOptions);
  const { data: settings, isLoading: settingsLoading } = useQuery(settingsQueryOptions);
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"cart" | "payment" | "success">("cart");
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const orderMutation = useMutation({
    mutationFn: (orderData: any) => apiPost("/api/orders", orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const isLoading = menuLoading || settingsLoading;
  if (isLoading || !settings) return <LoadingSpinner />;

  const cartItems = cart.map(c => {
    const item = menu.find((m: any) => m.id === c.itemId);
    return item ? { ...item, quantity: c.quantity } : null;
  }).filter(Boolean) as any[];

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  let deliveryFee = 0;
  let distance = 0;
  let isOutOfRange = false;

  if (user?.location && settings.locationLat && settings.locationLng) {
     distance = calculateDistance(user.location.lat, user.location.lng, settings.locationLat, settings.locationLng);
     if (distance > settings.deliveryRadiusKm) {
       isOutOfRange = true;
     }
  }

  if (isOutOfRange) {
    deliveryFee = 0;
  } else if (subtotal > 999) {
    deliveryFee = 0;
  } else {
    if (distance <= 5) {
      deliveryFee = 49;
    } else {
      deliveryFee = 99;
    }
  }

  if (!user?.location && subtotal <= 999) {
     deliveryFee = 49; 
  }

  const platformFee = 5;
  const total = subtotal + deliveryFee + platformFee;

  const handlePlaceOrder = () => {
    if (user?.isBlocked) {
       toast({ 
         title: "Account Blocked", 
         description: "Your account has been restricted. Please contact support.", 
         variant: "destructive" 
       });
       return;
    }

    if (!user?.location) {
       toast({ title: "Location Required", description: "Please complete your profile to set delivery location.", variant: "destructive" });
       return;
    }

    if (isOutOfRange) {
       toast({ title: "Not Deliverable", description: `Your location is ${distance.toFixed(1)} km away. We deliver within ${settings.deliveryRadiusKm} km only.`, variant: "destructive" });
       return;
    }
    
    setStep("payment");
  };

  const handlePaymentConfirm = () => {
    setTimeout(() => {
      const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
      orderMutation.mutate({
        orderId,
        customerPhone: user?.phoneNumber || "Unknown",
        customerName: user?.name || "Guest User",
        items: cartItems.map((i: any) => ({ itemId: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        total: total,
        status: "pending_payment",
        address: user?.address || "Address not provided",
      });
      clearCart();
      setStep("success");
    }, 1500);
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-orange-50 to-amber-50 text-center pb-20">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </motion.div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Order Placed!</h2>
        <p className="text-muted-foreground mt-2">Merchant will confirm your payment and process the order shortly.</p>
        <Button className="mt-8 w-full" onClick={() => { setStep("cart"); setLocation("/"); }}>Back to Home</Button>
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
        <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg">
           <h1 className="font-heading font-bold text-lg text-white">Payment</h1>
        </div>
        
        <div className="p-4 space-y-4 flex-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">UPI Payment</CardTitle>
              <CardDescription>Pay directly to merchant UPI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg flex items-center justify-between border border-dashed border-orange-200">
                <code className="font-mono font-bold text-lg select-all">{settings.upiId}</code>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(settings.upiId)}>Copy</Button>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p>1. Copy the UPI ID above.</p>
                <p>2. Open your UPI app (GPay, PhonePe, Paytm).</p>
                <p>3. Pay <strong>₹{total}</strong> to the copied ID.</p>
                <p>4. Come back here and click confirm.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
             <CardContent className="pt-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>₹{total}</span>
                </div>
             </CardContent>
          </Card>
        </div>

          <div className="p-4 bg-white border-t sticky bottom-0 space-y-2">
            <a 
              href={`upi://pay?pa=7013849563-2@ybl&pn=Monisha%20Kitchen&cu=INR&am=${total}`}
              className="w-full inline-flex items-center justify-center rounded-md text-lg font-bold h-11 px-8 bg-blue-600 text-white hover:bg-blue-700"
            >
              Pay via UPI
            </a>
            <Button size="lg" className="w-full text-lg font-bold" onClick={handlePaymentConfirm}>
               I have made the payment
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("cart")}>Cancel</Button>
          </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
      <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg">
         <h1 className="font-heading font-bold text-lg text-white">My Cart</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <ShoppingBag className="w-16 h-16 opacity-20 mb-4" />
          <p>Your cart is empty</p>
          <Button variant="link" className="text-primary" onClick={() => setLocation("/")}>Browse Food</Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {cartItems.map((item: any) => (
              <div key={item.id} className="bg-white p-3 rounded-xl shadow-md border border-orange-100/60 flex gap-3">
                <div className="w-16 h-16 rounded-lg bg-orange-50 overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-sm text-foreground line-clamp-1">{item.name}</h3>
                    <p className="font-bold text-sm text-primary">₹{item.price * item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 bg-primary rounded-lg px-2 py-1">
                       <button onClick={() => removeFromCart(item.id)} className="text-white hover:bg-white/10 rounded"><Minus className="w-3 h-3" /></button>
                       <span className="text-sm font-bold w-4 text-center text-white">{item.quantity}</span>
                       <button onClick={() => addToCart(item.id)} className="text-white hover:bg-white/10 rounded"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100/60 shadow-md space-y-3 mt-6">
              <h3 className="font-bold text-sm text-foreground/60 uppercase tracking-wider">Bill Details</h3>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/70">Item Total</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/70">Delivery Fee</span>
                <span>{isOutOfRange ? "—" : subtotal > 999 ? <span className="text-green-600 font-medium">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              {isOutOfRange && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                  <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Not Deliverable</p>
                    <p className="text-xs mt-0.5">Your location is {distance.toFixed(1)} km away. We deliver within {settings.deliveryRadiusKm} km only.</p>
                  </div>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-foreground/70">Platform Fee</span>
                <span>₹{platformFee}</span>
              </div>
              <div className="border-t border-dashed pt-3 flex justify-between font-bold text-base">
                <span>To Pay</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="p-4 bg-white border-t sticky bottom-16">
          {isOutOfRange ? (
            <Button size="lg" className="w-full text-lg font-bold bg-red-100 text-red-600 hover:bg-red-100 cursor-not-allowed" disabled>
              Not Deliverable to Your Area
            </Button>
          ) : (
            <Button size="lg" className="w-full text-lg font-bold shadow-lg shadow-primary/20" onClick={handlePlaceOrder}>
              Pay ₹{total}
            </Button>
          )}
        </div>
      )}
      <BottomNav />
    </div>
  );
}

function CustomerMenu() {
  const { data: menu = [], isLoading } = useQuery(menuQueryOptions);
  const addToCart = useStore((state) => state.addToCart);
  const [filter, setFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  if (isLoading) return <LoadingSpinner />;

  const filteredMenu = menu.filter((item: any) => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
       return false;
    }
    if (filter === "all") return true;
    if (filter === "veg") return item.isVeg;
    if (filter === "non-veg") return !item.isVeg;
    return true;
  });

  const handleAddToCart = (id: number) => {
    addToCart(id);
    toast({ title: "Added to cart", duration: 1000 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg space-y-3">
         <h1 className="font-heading font-bold text-lg text-white">Our Menu</h1>
         
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              className="pl-9 bg-orange-50 border-none" 
              placeholder="Search for dishes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>

         <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={filter === "all" ? "default" : "outline"} 
              onClick={() => setFilter("all")}
              className="rounded-full"
            >
              All
            </Button>
            <Button 
              size="sm" 
              variant={filter === "veg" ? "default" : "outline"} 
              onClick={() => setFilter("veg")}
              className={cn("rounded-full", filter === "veg" && "bg-green-600 hover:bg-green-700")}
            >
              Veg
            </Button>
            <Button 
              size="sm" 
              variant={filter === "non-veg" ? "default" : "outline"} 
              onClick={() => setFilter("non-veg")}
              className={cn("rounded-full", filter === "non-veg" && "bg-red-600 hover:bg-red-700")}
            >
              Non-Veg
            </Button>
         </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {filteredMenu.length > 0 ? (
             filteredMenu.map((item: any) => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-3 shadow-sm border border-orange-100/60 shadow-md flex gap-4"
              >
                <div className="relative shrink-0">
                  <div className="w-28 h-28 rounded-xl bg-orange-50 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <Button 
                    size="sm" 
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-8 px-6 shadow-md bg-white text-primary hover:bg-orange-50 hover:text-primary font-bold border border-orange-200 uppercase text-xs"
                    onClick={() => handleAddToCart(item.id)}
                  >
                    ADD
                  </Button>
                </div>
                <div className="flex-1 py-1">
                  <div className="flex justify-between items-start">
                    <div className={cn("w-4 h-4 rounded-sm border flex items-center justify-center p-[2px]", item.isVeg ? "border-green-600" : "border-red-600")}>
                      <div className={cn("w-full h-full rounded-full", item.isVeg ? "bg-green-600" : "bg-red-600")}></div>
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground mt-1 line-clamp-1">{item.name}</h3>
                  
                  <div className="flex items-center gap-2 mt-2">
                     <span className="text-sm font-bold text-foreground">₹{item.price}</span>
                     {item.originalPrice && (
                       <span className="text-xs text-foreground/40 line-through">₹{item.originalPrice}</span>
                     )}
                     {item.originalPrice && (
                       <span className="text-[10px] font-bold text-green-600">
                          {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                       </span>
                     )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
             ))
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                <p>No items found.</p>
             </div>
          )}
      </div>
      <BottomNav />
    </div>
  );
}

function CustomerOrders() {
  const user = useStore((state) => state.user);
  const { data: orders = [], isLoading } = useQuery(customerOrdersQueryOptions(user?.phoneNumber || ""));

  const sortedOrders = [...orders].sort((a: any, b: any) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "pending_payment": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid": return "bg-blue-100 text-blue-800 border-blue-200";
      case "preparing": return "bg-orange-100 text-orange-800 border-orange-200";
      case "ready": return "bg-purple-100 text-purple-800 border-purple-200";
      case "on_the_way": return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "refunded": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-orange-50 text-foreground";
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg">
         <h1 className="font-heading font-bold text-lg text-white">My Orders</h1>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {sortedOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-50">
             <ListOrdered className="w-16 h-16 mb-4" />
             <p>No orders yet</p>
          </div>
        ) : (
          sortedOrders.map((order: any) => (
            <Card key={order.id} className="overflow-hidden border-neutral-100 shadow-sm">
               <div className="p-4 border-b bg-orange-50/50 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">Order #{order.orderId}</p>
                    <p className="text-xs text-foreground/60">{order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}</p>
                  </div>
                  <Badge variant="outline" className={cn("border-0", getStatusColor(order.status))}>
                    {order.status.replace("_", " ")}
                  </Badge>
               </div>
               <CardContent className="p-4">
                  <div className="space-y-1">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                         <span className="text-foreground/70">{item.quantity} x {item.name}</span>
                         <span className="font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-3 pt-3 flex justify-between font-bold">
                    <span>Total Bill</span>
                    <span>₹{order.total}</span>
                  </div>
               </CardContent>
            </Card>
          ))
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function CustomerProfile() {
  const { user, logout } = useStore();
  const setLocation = useLocation()[1];

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg">
         <h1 className="font-heading font-bold text-lg text-white">My Profile</h1>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto flex-1">
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100/60 shadow-md flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl flex-shrink-0">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg">{user?.name || "User"}</h2>
              <p className="text-sm text-foreground/60">{user?.phoneNumber}</p>
              <p className="text-xs text-foreground/40 mt-1 line-clamp-1">{user?.address || "Address not set"}</p>
            </div>
            <Button variant="outline" size="sm" className="flex-shrink-0" onClick={() => setLocation("/profile-setup")}>
              Edit
            </Button>
         </div>

         <div className="bg-white rounded-2xl shadow-sm border border-orange-100/60 shadow-md overflow-hidden">
            {[
              { icon: FileText, label: "Terms & Conditions", action: () => setLocation("/terms") },
              { icon: Shield, label: "Privacy Policy", action: () => setLocation("/privacy-policy") },
              { icon: RefreshCcw, label: "Refund & Cancellation", action: () => setLocation("/refund-policy") },
              { icon: MapPin, label: "Delivery Policy", action: () => setLocation("/delivery-policy") },
              { icon: HelpCircle, label: "Contact Monisha Kitchen", action: () => setLocation("/contact") },
            ].map((item, idx) => (
              <button key={idx} onClick={item.action} className="w-full p-4 flex items-center justify-between border-b last:border-0 hover:bg-orange-50 text-left">
                 <div className="flex items-center gap-3">
                   <item.icon className="w-5 h-5 text-foreground/60" />
                   <span className="font-medium text-sm text-foreground/80">{item.label}</span>
                 </div>
                 <ChevronRight className="w-4 h-4 text-foreground/40" />
              </button>
            ))}
         </div>

         <Button variant="destructive" className="w-full" onClick={handleLogout}>
           <LogOut className="w-4 h-4 mr-2" />
           Logout
         </Button>

         <div className="flex flex-col items-center gap-2 pt-6 pb-2">
           <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-orange-100/60 shadow-md flex items-center justify-center overflow-hidden">
             <img src="/images/gryfon-logo.png" alt="Gryfon Technologies" className="w-8 h-8 object-contain" />
           </div>
           <p className="text-xs text-foreground/40">Designed and developed by <span className="font-semibold text-foreground/60">GRYFON TECHNOLOGIES</span></p>
         </div>
      </div>
      <BottomNav />
    </div>
  );
}

function CustomerCategories() {
  const { data: menu = [], isLoading: menuLoading } = useQuery(menuQueryOptions);
  const { data: categoriesData = [] } = useQuery(categoriesQueryOptions);
  const setLocation = useLocation()[1];

  const categoryImages: Record<string, string> = {};
  categoriesData.forEach((c: any) => {
    if (c.image) categoryImages[c.category] = c.image;
  });

  const categories = Array.from(new Set(menu.map((item: any) => item.category)));

  if (menuLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ChevronRight className="w-6 h-6 rotate-180" />
         </Button>
         <h1 className="font-heading font-bold text-lg text-white">All Categories</h1>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <div key={cat} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setLocation(`/category/${encodeURIComponent(cat)}`)}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white shadow-sm border border-orange-100/60 shadow-md flex items-center justify-center overflow-hidden">
                {categoryImages[cat] ? (
                  <img src={categoryImages[cat]} alt={cat} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[10px] text-muted-foreground font-medium text-center p-1 break-words line-clamp-2">{cat}</div>
                )}
              </div>
              <span className="text-xs font-medium text-foreground/70 text-center line-clamp-2 w-full px-1">{cat}</span>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function CustomerCategoryItems({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category);
  const { data: menu = [], isLoading: menuLoading } = useQuery(menuQueryOptions);
  const { data: settings, isLoading: settingsLoading } = useQuery(settingsQueryOptions);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const user = useStore((state) => state.user);
  const { toast } = useToast();
  const setLocation = useLocation()[1];

  if (menuLoading || settingsLoading || !settings) return <LoadingSpinner />;

  const categoryItems = menu.filter((item: any) => item.category === category);

  const handleAddToCart = (id: number, increment: boolean = true) => {
    if (user?.isBlocked) {
       toast({ 
         title: "Account Blocked", 
         description: "Your account has been restricted. Please contact support.", 
         variant: "destructive" 
       });
       return;
    }

    if (!settings.isOpen) {
       if (settings.openTime) {
         const now = new Date();
         const [openHour, openMinute] = settings.openTime.split(':').map(Number);
         const openDate = new Date();
         openDate.setHours(openHour, openMinute, 0, 0);
         if (now > openDate) openDate.setDate(openDate.getDate() + 1);
         const diffMs = openDate.getTime() - now.getTime();
         const diffMins = diffMs / (1000 * 60);
         
         if (diffMins <= 30 && diffMins > 0) {
            if (increment) {
              addToCart(id);
              toast({ title: "Pre-order Accepted", description: "Shop will start preparing the order in 30 mins. Thank you for your order!", className: "bg-green-600 text-white border-none" });
            } else {
              removeFromCart(id);
            }
            return;
         }
       }
       toast({ title: "Store Closed", description: settings.nextOpenMessage || `We open at ${settings.openTime}`, variant: "destructive" });
       return;
    }

    if (increment) {
        addToCart(id);
        toast({ title: "Added to cart", description: "Item has been added to your cart", duration: 1500 });
    } else {
        removeFromCart(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ChevronRight className="w-6 h-6 rotate-180" />
         </Button>
         <h1 className="font-heading font-bold text-lg text-white">{category}</h1>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {categoryItems.length > 0 ? (
          categoryItems.map((item: any) => (
            <DishCard key={item.id} item={item} handleAddToCart={handleAddToCart} />
          ))
        ) : (
          <div className="text-center py-20 opacity-50">
             <Utensils className="w-16 h-16 mx-auto mb-4" />
             <p>No items in this category</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

// --- Policy Pages ---

function CustomerTerms() {
  const setLocation = useLocation()[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={() => setLocation("/profile")}>
            <ChevronRight className="w-6 h-6 rotate-180" />
         </Button>
         <h1 className="font-heading font-bold text-lg text-white">Terms & Conditions</h1>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto flex-1 text-sm text-foreground/80 leading-relaxed">
        
        <div className="space-y-4">
          <div className="border-b pb-2">
            <h2 className="text-xl font-bold text-primary font-heading">📜 Terms & Conditions</h2>
            <p className="text-xs text-muted-foreground mt-1">Effective Date: 09/02/2026</p>
          </div>
          
          <p>
            Welcome to Monisha Kitchen. This application is intended for commercial use to facilitate food ordering and delivery services. By downloading, accessing, or using this application, you agree to comply with and be bound by the following Terms & Conditions. If you do not agree, please do not use the application.
          </p>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">1. Use of the Application</h3>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>This application is intended for commercial food ordering and delivery purposes.</li>
              <li>Users must provide accurate and complete information while placing orders.</li>
              <li>Any misuse of the application, including fraudulent activity, false orders, or abuse of services, may result in suspension or termination of access.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">2. Orders & Payments</h3>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>All orders placed through the application are subject to acceptance by Monisha Kitchen.</li>
              <li>Prices, menu items, and availability may change without prior notice.</li>
              <li>Once an order is confirmed and food preparation has started, cancellation may not be permitted.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">3. Food Quality & Allergies</h3>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>Monisha Kitchen follows standard food safety and hygiene practices.</li>
              <li>Customers are responsible for informing the restaurant of any food allergies or dietary restrictions before placing an order.</li>
              <li>Monisha Kitchen shall not be responsible for allergic reactions if such information is not provided in advance.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">4. Delivery Responsibility</h3>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>Delivery time estimates provided in the application are approximate.</li>
              <li>Delays may occur due to traffic conditions, weather, operational issues, or order volume.</li>
              <li>Such delays do not constitute a failure of service.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">5. Limitation of Liability</h3>
            <p>Monisha Kitchen shall not be liable for any indirect, incidental, or consequential damages arising from the use of this application or delivery services.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">6. Changes to Terms</h3>
            <p>Monisha Kitchen reserves the right to update or modify these Terms & Conditions at any time. Continued use of the application signifies acceptance of the revised terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function CustomerPrivacyPolicy() {
  const setLocation = useLocation()[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={() => setLocation("/profile")}>
            <ChevronRight className="w-6 h-6 rotate-180" />
         </Button>
         <h1 className="font-heading font-bold text-lg text-white">Privacy Policy</h1>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto flex-1 text-sm text-foreground/80 leading-relaxed">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary font-heading">🔒 Privacy Policy</h2>
          <p>Monisha Kitchen respects your privacy and is committed to protecting your personal information.</p>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">1. Information We Collect</h3>
            <p>We may collect the following information:</p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>Name</li>
              <li>Phone number</li>
              <li>Delivery address</li>
              <li>Order details</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">2. Use of Information</h3>
            <p>Collected information is used solely for:</p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>Processing and delivering orders</li>
              <li>Communicating order updates</li>
              <li>Customer support and service improvement</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">3. Data Sharing</h3>
            <p>Personal information is not sold or shared with third parties except where required to fulfill delivery services or comply with legal obligations.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">4. Data Security</h3>
            <p>We take reasonable measures to protect user data from unauthorized access, disclosure, or misuse.</p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">5. User Rights</h3>
            <p>Users may contact Monisha Kitchen to request correction or deletion of their personal data, subject to legal and operational requirements.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function CustomerRefundPolicy() {
  const setLocation = useLocation()[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={() => setLocation("/profile")}>
            <ChevronRight className="w-6 h-6 rotate-180" />
         </Button>
         <h1 className="font-heading font-bold text-lg text-white">Refund & Cancellation</h1>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto flex-1 text-sm text-foreground/80 leading-relaxed">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary font-heading">💳 Refund & Cancellation Policy</h2>
          
          <section className="space-y-2">
            <h3 className="font-bold text-foreground">Order Cancellation</h3>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>Orders may be cancelled only before food preparation has started.</li>
              <li>Once preparation begins, cancellation requests may not be accepted.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">Refunds</h3>
            <p>Refunds may be issued in cases of:</p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>Incorrect items delivered</li>
              <li>Orders not delivered</li>
              <li>Quality issues reported within a reasonable time</li>
            </ul>
            <p className="mt-2">Approved refunds will be processed using the original payment method or as store credit, depending on the situation.</p>
            <p>Refund decisions are made at the discretion of Monisha Kitchen.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function CustomerDeliveryPolicy() {
  const setLocation = useLocation()[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={() => setLocation("/profile")}>
            <ChevronRight className="w-6 h-6 rotate-180" />
         </Button>
         <h1 className="font-heading font-bold text-lg text-white">Delivery Policy</h1>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto flex-1 text-sm text-foreground/80 leading-relaxed">
        
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary font-heading">🚚 Delivery Policy</h2>
          <p>Monisha Kitchen provides food delivery services arranged directly by the shop.</p>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">Delivery Arrangement</h3>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>Delivery is managed by Monisha Kitchen.</li>
              <li>Customers must ensure the accuracy of delivery address and contact details.</li>
              <li>Monisha Kitchen is not responsible for delays or failed deliveries caused by incorrect information or customer unavailability.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-foreground">Estimated Delivery Time</h3>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>Within 5 km radius: approximately 30 minutes</li>
              <li>Beyond 5 km radius: approximately 45 minutes</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">Delivery times may vary depending on traffic, order pressure, and operational conditions.</p>
          </section>
        </div>

        <div className="space-y-4 pt-4 border-t border-neutral-200">
          <h2 className="text-xl font-bold text-primary font-heading">📍 Service Area Policy</h2>
          <ul className="list-disc pl-5 space-y-1 text-foreground/70">
            <li>Monisha Kitchen currently delivers within a limited service radius from the restaurant location.</li>
            <li>Orders placed outside the supported delivery area may be declined or subject to extended delivery times.</li>
            <li>Service areas may change based on operational capacity without prior notice.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

function CustomerContact() {
  const setLocation = useLocation()[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={() => setLocation("/profile")}>
            <ChevronRight className="w-6 h-6 rotate-180" />
         </Button>
         <h1 className="font-heading font-bold text-lg text-white">Contact Us</h1>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm text-foreground/80 leading-relaxed">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100/60 shadow-md text-center space-y-4">
           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-primary" />
           </div>
           
           <div>
             <h2 className="text-xl font-bold text-foreground font-heading">Monisha Kitchen</h2>
             <p className="text-muted-foreground mt-1">For any queries, complaints, or support requests, please contact us.</p>
           </div>

           <div className="pt-4 border-t border-neutral-100">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Phone Support</p>
              <a href="tel:7013849563" className="text-2xl font-bold text-primary hover:underline">
                7013849563
              </a>
           </div>

           <div className="pt-4 border-t border-neutral-100">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">FSSAI License No.</p>
              <p className="text-sm font-medium text-foreground">
                20119038001047
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- Pages: Merchant ---

function CustomerBannerItems({ params }: { params: { bannerId: string } }) {
  const bannerId = Number(params.bannerId);
  const { data: menu = [], isLoading: menuLoading } = useQuery(menuQueryOptions);
  const { data: banners = [], isLoading: bannersLoading } = useQuery(bannersQueryOptions);
  const { data: settings, isLoading: settingsLoading } = useQuery(settingsQueryOptions);
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const { toast } = useToast();
  const setLocation = useLocation()[1];

  if (menuLoading || bannersLoading || settingsLoading || !settings) return <LoadingSpinner />;

  const banner = banners.find((b: any) => b.id === bannerId);
  const bannerItems = menu.filter((item: any) => banner?.linkedItemIds?.includes(item.id));

  const handleAddToCart = (id: number, increment: boolean = true) => {
    const currentUser = useStore.getState().user;
    if (currentUser?.isBlocked) {
        toast({ 
          title: "Account Blocked", 
          description: "Your account has been restricted. Please contact support.", 
          variant: "destructive" 
        });
        return;
    }

    if (!settings.isOpen) {
       if (settings.openTime) {
         const now = new Date();
         const [openHour, openMinute] = settings.openTime.split(':').map(Number);
         const openDate = new Date();
         openDate.setHours(openHour, openMinute, 0, 0);
         if (now > openDate) openDate.setDate(openDate.getDate() + 1);
         const diffMs = openDate.getTime() - now.getTime();
         const diffMins = diffMs / (1000 * 60);
         
         if (diffMins <= 30 && diffMins > 0) {
            if (increment) {
              addToCart(id);
              toast({ title: "Pre-order Accepted", description: "Shop will start preparing the order in 30 mins. Thank you for your order!", className: "bg-green-600 text-white border-none" });
            } else {
              removeFromCart(id);
            }
            return;
         }
       }
       toast({ title: "Store Closed", description: settings.nextOpenMessage || `We open at ${settings.openTime}`, variant: "destructive" });
       return;
    }

    if (increment) {
        addToCart(id);
        toast({ title: "Added to cart", description: "Item has been added to your cart", duration: 1500 });
    } else {
        removeFromCart(id);
    }
  };

  if (!banner) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 to-amber-50/40 pb-20 flex flex-col">
       <div className="p-4 bg-gradient-to-r from-amber-500 to-amber-400 sticky top-0 z-30 shadow-lg flex items-center gap-3">
         <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
            <ChevronRight className="w-6 h-6 rotate-180" />
         </Button>
         <div>
           <h1 className="font-heading font-bold text-lg text-white">{banner.title}</h1>
           <p className="text-xs text-muted-foreground">{banner.subtitle}</p>
         </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {bannerItems.length > 0 ? (
          bannerItems.map((item: any) => (
            <DishCard key={item.id} item={item} handleAddToCart={handleAddToCart} />
          ))
        ) : (
          <div className="text-center py-20 opacity-50">
             <Utensils className="w-16 h-16 mx-auto mb-4" />
             <p>No items linked to this banner</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function MerchantDashboard() {
  const { data: orders = [], isLoading: ordersLoading } = useQuery(ordersQueryOptions);
  const { data: settings, isLoading: settingsLoading } = useQuery(settingsQueryOptions);
  const merchantLogoutStore = useStore((state) => state.merchantLogout);
  const merchantToken = useStore((state) => state.merchantToken);
  const merchantLocationSet = useStore((state) => state.merchantLocationSet);
  const setMerchantLocationSet = useStore((state) => state.setMerchantLocationSet);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [detectingStoreLocation, setDetectingStoreLocation] = useState(false);

  const handleGetStoreLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Not Supported", description: "Geolocation is not supported by your browser.", variant: "destructive" });
      return;
    }
    setDetectingStoreLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          await apiPatch("/api/settings", { locationLat: lat, locationLng: lng });
          queryClient.invalidateQueries({ queryKey: ["settings"] });
          setMerchantLocationSet();
          toast({ title: "Store Location Set", description: "Your current location has been saved as the store location." });
        } catch {
          toast({ title: "Failed", description: "Could not save store location.", variant: "destructive" });
        } finally {
          setDetectingStoreLocation(false);
        }
      },
      () => {
        setDetectingStoreLocation(false);
        toast({ title: "Location Denied", description: "Please allow location access to set your store location.", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleMerchantLogout = () => {
    if (merchantToken) {
      fetch("/api/merchant/logout", { method: "POST", headers: { "x-merchant-token": merchantToken } }).catch(() => {});
    }
    merchantLogoutStore();
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      apiPatch(`/api/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
  
  if (ordersLoading || settingsLoading || !settings) return <LoadingSpinner />;

  const sortedOrders = [...orders].sort((a: any, b: any) => {
    if (a.status === "pending_payment" && b.status !== "pending_payment") return -1;
    if (a.status !== "pending_payment" && b.status === "pending_payment") return 1;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case "pending_payment": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid": return "bg-blue-100 text-blue-800 border-blue-200";
      case "preparing": return "bg-orange-100 text-orange-800 border-orange-200";
      case "ready": return "bg-purple-100 text-purple-800 border-purple-200";
      case "on_the_way": return "bg-blue-100 text-blue-800 border-blue-200";
      case "delivered": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "refunded": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-orange-50 text-foreground";
    }
  };

  const updateOrderStatus = (orderId: string, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  return (
    <div className="min-h-screen bg-neutral-900 pb-20 text-neutral-100 flex flex-col">
       <div className="p-6 bg-neutral-900 sticky top-0 z-30 border-b border-neutral-800 flex justify-between items-center">
         <div>
            <h1 className="font-heading font-bold text-xl">{settings.storeName}</h1>
            <p className="text-xs text-foreground/40 uppercase tracking-widest font-medium mt-1">Merchant Dashboard</p>
         </div>
         <div className="flex items-center gap-2">
           {!merchantLocationSet && (
             <Button variant="outline" size="sm" className="h-8 border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white" onClick={handleGetStoreLocation} disabled={detectingStoreLocation} data-testid="button-get-store-location">
               <MapPin className="w-4 h-4 mr-1" />
               {detectingStoreLocation ? "Detecting..." : "Get Location"}
             </Button>
           )}
           <Button variant="outline" size="sm" className="h-8 border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white" onClick={handleMerchantLogout}>
             Logout
           </Button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <ListOrdered className="w-16 h-16 mx-auto mb-4" />
            <p>No orders yet</p>
          </div>
        ) : (
          sortedOrders.map((order: any) => (
            <Card key={order.id} className="bg-neutral-800 border-neutral-700 text-neutral-100 overflow-hidden max-w-2xl">
              <div className={cn("px-4 py-2 text-xs font-bold uppercase tracking-wider border-b border-dashed border-neutral-700 flex justify-between items-center", getStatusColor(order.status).replace("border-", ""))}>
                <span>Order #{order.orderId}</span>
                <span>{order.status.replace("_", " ")}</span>
              </div>
              <CardContent className="pt-4 space-y-4">
                <div className="text-sm bg-neutral-900/50 p-3 rounded-lg border border-neutral-700">
                   <p className="font-bold text-neutral-300 mb-1">Customer Details</p>
                   <p className="flex items-center gap-2"><span className="text-foreground/60 w-16">Name:</span> {order.customerName}</p>
                   <p className="flex items-center gap-2">
                     <span className="text-foreground/60 w-16">Phone:</span> 
                     <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">{order.customerPhone}</a>
                   </p>
                   <p className="flex items-start gap-2 mt-1">
                     <span className="text-foreground/60 w-16 shrink-0">Address:</span> 
                     <span className="break-words">{order.address}</span>
                   </p>
                </div>

                <div className="space-y-2">
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                       <span><span className="font-bold text-foreground/40">{item.quantity}x</span> {item.name}</span>
                       <span className="text-foreground/40">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-neutral-700 pt-3 flex justify-between font-bold">
                   <span>Total</span>
                   <span>₹{order.total}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {order.status === "pending_payment" && (
                    <>
                      <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50" size="sm" onClick={() => updateOrderStatus(order.orderId, "rejected")}>Reject</Button>
                      <Button variant="destructive" size="sm" onClick={() => updateOrderStatus(order.orderId, "rejected")}>Payment Not Received</Button>
                      <Button className="col-span-2 bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => updateOrderStatus(order.orderId, "preparing")}>Payment Received</Button>
                    </>
                  )}
                  {order.status === "preparing" && (
                     <>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white" size="sm" onClick={() => updateOrderStatus(order.orderId, "ready")}>Mark Ready</Button>
                        <Button variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-900/20" size="sm" onClick={() => updateOrderStatus(order.orderId, "refunded")}>Refund</Button>
                     </>
                  )}
                  {order.status === "ready" && (
                     <>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm" onClick={() => updateOrderStatus(order.orderId, "on_the_way")}>Mark On the Way</Button>
                        <Button variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-900/20" size="sm" onClick={() => updateOrderStatus(order.orderId, "refunded")}>Refund</Button>
                     </>
                  )}
                  {order.status === "on_the_way" && (
                     <>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm" onClick={() => updateOrderStatus(order.orderId, "delivered")}>Mark Delivered</Button>
                        <Button variant="outline" className="border-red-900/50 text-red-500 hover:bg-red-900/20" size="sm" onClick={() => updateOrderStatus(order.orderId, "refunded")}>Refund</Button>
                     </>
                  )}
                  {order.status === "delivered" && (
                     <Button variant="outline" className="col-span-2 border-red-900/50 text-red-500 hover:bg-red-900/20" size="sm" onClick={() => updateOrderStatus(order.orderId, "refunded")}>Refund</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <MerchantNav />
    </div>
  );
}

function MerchantMenu() {
  const { data: menu = [], isLoading: menuLoading } = useQuery(menuQueryOptions);
  const { data: categoriesData = [], isLoading: catLoading } = useQuery(categoriesQueryOptions);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const categoryImages: Record<string, string> = {};
  const visibleCategories: string[] = [];
  categoriesData.forEach((c: any) => {
    if (c.image) categoryImages[c.category] = c.image;
    if (c.visible) visibleCategories.push(c.category);
  });

  const categories = Array.from(new Set(menu.map((item: any) => item.category)));

  const [newItem, setNewItem] = useState<any>({
     name: "", description: "", price: 0, category: "Main", isVeg: true, image: "/assets/biryani.png", available: true, originalPrice: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const categoryImageRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const addMenuMutation = useMutation({
    mutationFn: (data: any) => apiPost("/api/menu", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const updateMenuMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPatch(`/api/menu/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const deleteMenuMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/menu/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const importMenuMutation = useMutation({
    mutationFn: (items: any[]) => apiPost("/api/menu/import", { items }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });

  const setCategoryImageMutation = useMutation({
    mutationFn: (data: { category: string; image: string }) => apiPost("/api/categories/image", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const toggleCategoryVisibilityMutation = useMutation({
    mutationFn: (cat: string) => apiPatch(`/api/categories/${encodeURIComponent(cat)}/visibility`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const handleAdd = () => {
    if (newItem.name && newItem.price) {
      if (editingItem) {
         const { id, ...data } = newItem;
         updateMenuMutation.mutate({ id: editingItem.id, data });
         setEditingItem(null);
      } else {
         addMenuMutation.mutate(newItem);
      }
      setIsAddOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setNewItem({ name: "", description: "", price: 0, category: "Main", isVeg: true, image: "/assets/biryani.png", available: true, originalPrice: 0 });
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setNewItem({ ...item });
    setIsAddOpen(true);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const path = `menu/${Date.now()}_${file.name}`;
        const url = await compressAndUploadImage(file, path);
        setNewItem((prev: any) => ({ ...prev, image: url }));
        toast({ title: "Image uploaded" });
      } catch (err: any) {
        toast({ title: "Upload failed", description: err?.message, variant: "destructive" });
      }
    }
    e.target.value = "";
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCategory) {
      try {
        const path = `categories/${selectedCategory.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
        const url = await compressAndUploadImage(file, path);
        setCategoryImageMutation.mutate({ category: selectedCategory, image: url });
        setSelectedCategory(null);
        toast({ title: "Category image uploaded" });
      } catch (err: any) {
        toast({ title: "Upload failed", description: err?.message, variant: "destructive" });
      }
    }
    e.target.value = "";
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const newItems: any[] = [];
        const rows = jsonData as any[][];
        
        let startIndex = 0;
        
        for(let i=0; i<Math.min(rows.length, 10); i++) {
            const rowStr = (rows[i] || []).join(" ").toLowerCase();
            if(rowStr.includes("price") || rowStr.includes("name")) {
                startIndex = i + 1;
                break;
            }
        }

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const name = row[0];
          const price = Number(row[1]) || 0;
          const description = row[2] || "";
          let category = row[3] || "Main Course";
          
          category = category.replace(/special/gi, "").trim();
          if (!category) category = "Main Course";
          
          const type = String(row[4] || "veg").toLowerCase();
          const isVeg = !type.includes("non");
          
          if (name && price) {
             newItems.push({
               name,
               price,
               description,
               category,
               isVeg,
               available: true,
               image: "/assets/biryani.png",
               originalPrice: Math.round(price * 1.2)
             });
          }
        }
        
        if (newItems.length > 0) {
          importMenuMutation.mutate(newItems);
          setIsImportOpen(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    e.target.value = "";
  };

  const downloadSampleCSV = () => {
    const csvContent = "Dish Name,Price,Description,Category,Type\nButter Chicken,350,Creamy tomato curry,Main Course,Non-Veg\nPaneer Tikka,280,Grilled cottage cheese,Starter,Veg\nChicken Biryani,300,Aromatic rice dish,Main Course,Non-Veg";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "menu_sample.csv";
    a.click();
  };

  if (menuLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-neutral-900 pb-20 text-neutral-100 flex flex-col">
       <div className="p-6 bg-neutral-900 sticky top-0 z-30 border-b border-neutral-800 flex justify-between items-center">
         <h1 className="font-heading font-bold text-xl">Menu Management</h1>
         <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full border-neutral-700 bg-neutral-800 hover:bg-neutral-700" onClick={() => setIsCategoryOpen(true)}>
              <ImageIcon className="w-5 h-5 text-blue-500" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full border-neutral-700 bg-neutral-800 hover:bg-neutral-700" onClick={() => setIsImportOpen(true)}>
              <FileSpreadsheet className="w-5 h-5 text-green-500" />
            </Button>
            <Button size="icon" className="rounded-full bg-primary hover:bg-primary/90" onClick={() => { resetForm(); setIsAddOpen(true); }}>
              <Plus className="w-5 h-5" />
            </Button>
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {menu.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Utensils className="w-16 h-16 mx-auto mb-4" />
            <p>No items in menu</p>
            <Button variant="link" onClick={() => setIsImportOpen(true)} className="text-primary mt-2">Import from CSV</Button>
          </div>
        ) : (
          menu.map((item: any) => (
             <div key={item.id} className="bg-neutral-800 p-3 rounded-xl border border-neutral-700 flex gap-3" onClick={() => handleEdit(item)}>
                <div className="w-20 h-20 rounded-lg bg-neutral-700 overflow-hidden shrink-0 relative group">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                     <span className="text-xs">Edit</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between">
                      <h3 className="font-bold truncate">{item.name}</h3>
                      <button onClick={(e) => { e.stopPropagation(); deleteMenuMutation.mutate(item.id); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                   </div>
                   <div className="flex items-center gap-2 mt-1">
                     <p className="text-sm text-foreground/40">₹{item.price}</p>
                     {item.originalPrice && item.originalPrice > item.price && (
                        <Badge variant="outline" className="border-green-800 text-green-500 text-[10px] h-4 px-1">
                           {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                        </Badge>
                     )}
                   </div>
                   
                   <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="border-neutral-600 text-foreground/40 text-[10px]">{item.category}</Badge>
                      <Badge variant="outline" className={cn("text-[10px] border-transparent", item.isVeg ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400")}>
                        {item.isVeg ? "VEG" : "NON-VEG"}
                      </Badge>
                   </div>
                </div>
             </div>
          ))
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsAddOpen(open); }}>
        <DialogContent className="bg-neutral-800 border-neutral-700 text-neutral-100 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label>Dish Name</Label>
              <Input className="bg-neutral-900 border-neutral-700" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <Label>Dish Description</Label>
              <Textarea className="bg-neutral-900 border-neutral-700" value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label>Dish Price (INR)</Label>
                 <Input type="number" className="bg-neutral-900 border-neutral-700" value={newItem.price} onChange={e => setNewItem({...newItem, price: Number(e.target.value)})} />
               </div>
               <div className="grid gap-2">
                 <Label>Original Price (₹)</Label>
                 <Input type="number" placeholder="Optional" className="bg-neutral-900 border-neutral-700" value={newItem.originalPrice || ""} onChange={e => setNewItem({...newItem, originalPrice: Number(e.target.value)})} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Dish Category</Label>
                    <Input className="bg-neutral-900 border-neutral-700" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
                </div>
                <div className="grid gap-2">
                    <Label>Dish Type</Label>
                    <div className="flex bg-neutral-900 p-1 rounded-md border border-neutral-700">
                      <button 
                        className={cn("flex-1 text-xs font-bold py-1.5 rounded", newItem.isVeg ? "bg-green-700 text-white" : "text-foreground/40 hover:text-white")}
                        onClick={() => setNewItem({...newItem, isVeg: true})}
                      >
                        Veg
                      </button>
                      <button 
                        className={cn("flex-1 text-xs font-bold py-1.5 rounded", !newItem.isVeg ? "bg-red-700 text-white" : "text-foreground/40 hover:text-white")}
                        onClick={() => setNewItem({...newItem, isVeg: false})}
                      >
                        Non-Veg
                      </button>
                    </div>
                </div>
            </div>
            
            <div className="grid gap-2">
               <Label>Photo Upload</Label>
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border rounded overflow-hidden bg-neutral-900">
                    {newItem.image && <img src={newItem.image} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 space-y-2">
                     <input 
                       type="file" 
                       accept="image/*" 
                       ref={fileInputRef} 
                       className="hidden" 
                       onChange={handleImageUpload}
                     />
                     <Button size="sm" variant="outline" className="w-full border-neutral-600 hover:bg-neutral-700" onClick={() => fileInputRef.current?.click()}>
                       <Upload className="w-4 h-4 mr-2" /> {newItem.image ? "Change Photo" : "Upload Photo"}
                     </Button>
                     {newItem.image && (
                       <Button size="sm" variant="destructive" className="w-full h-7 text-xs" onClick={() => setNewItem((prev: any) => ({ ...prev, image: "" }))}>
                         <X className="w-3 h-3 mr-1" /> Remove Photo
                       </Button>
                     )}
                  </div>
               </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>{editingItem ? "Update Dish" : "Add Dish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="bg-neutral-800 border-neutral-700 text-neutral-100">
           <DialogHeader>
              <DialogTitle>Import Menu from Excel/CSV</DialogTitle>
              <CardDescription className="text-foreground/40">
                Bulk upload dishes using an Excel (.xlsx) or CSV file. This will replace existing items.
              </CardDescription>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-700 space-y-2">
                 <h4 className="text-sm font-bold text-neutral-300">Format Required (Columns):</h4>
                 <code className="block text-xs text-foreground/60 font-mono bg-black/30 p-2 rounded">
                   Dish Name | Price | Description | Category | Type
                 </code>
                 <p className="text-xs text-foreground/60">Type can be "Veg" or "Non-Veg"</p>
                 <Button variant="link" className="text-primary h-auto p-0 text-xs" onClick={downloadSampleCSV}>
                   <Download className="w-3 h-3 mr-1" /> Download Sample CSV
                 </Button>
              </div>

              <div className="flex flex-col gap-2">
                 <input 
                   type="file" 
                   accept=".csv, .xlsx, .xls"
                   ref={importInputRef}
                   className="hidden"
                   onChange={handleImportFile}
                 />
                 <Button className="w-full" onClick={() => importInputRef.current?.click()}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Select File
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <DialogContent className="bg-neutral-800 border-neutral-700 text-neutral-100 max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Manage Categories</DialogTitle>
              <CardDescription className="text-foreground/40">
                  Select categories to show on home screen and update images.
              </CardDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
               {categories.map((cat) => (
                   <div key={cat} className={cn("bg-neutral-900 p-3 rounded-lg border flex flex-col items-center gap-2", visibleCategories.includes(cat) ? "border-primary" : "border-neutral-700")}>
                       <div className="w-full flex justify-between items-start mb-1">
                          <span className="text-[10px] text-foreground/60">{visibleCategories.includes(cat) ? "Shown" : "Hidden"}</span>
                          <input 
                            type="checkbox" 
                            checked={visibleCategories.includes(cat)} 
                            onChange={() => toggleCategoryVisibilityMutation.mutate(cat)}
                            className="w-4 h-4 accent-primary"
                          />
                       </div>
                       
                       <div className="w-full aspect-square bg-neutral-800 rounded overflow-hidden">
                           {categoryImages[cat] ? (
                               <img src={categoryImages[cat]} alt={cat} className="w-full h-full object-cover" />
                           ) : (
                               <div className="flex items-center justify-center w-full h-full text-foreground/70 text-xs text-center p-2">
                                   No Image
                               </div>
                           )}
                       </div>
                       <Button size="sm" variant="secondary" className="w-full h-7 text-[10px]" onClick={() => { setSelectedCategory(cat); categoryImageRef.current?.click(); }}>
                           <Upload className="w-3 h-3 mr-1" /> {categoryImages[cat] ? "Change" : "Upload"}
                       </Button>
                       <span className="text-xs font-bold truncate w-full text-center">{cat}</span>
                   </div>
               ))}
            </div>
            
            <input 
                type="file" 
                accept="image/*"
                ref={categoryImageRef}
                className="hidden"
                onChange={handleCategoryImageUpload}
            />
        </DialogContent>
      </Dialog>
      
      <MerchantNav />
    </div>
  );
}

function MerchantSettings() {
  const { data: settings, isLoading: settingsLoading } = useQuery(settingsQueryOptions);
  const { data: banners = [], isLoading: bannersLoading } = useQuery(bannersQueryOptions);
  const { data: menu = [], isLoading: menuLoading } = useQuery(menuQueryOptions);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBannerId, setSelectedBannerId] = useState<number | null>(null);
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const bannerImageRef = useRef<HTMLInputElement>(null);
  const [uploadingBannerId, setUploadingBannerId] = useState<number | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const handleSaveStoreLocation = async (lat: number, lng: number, radius: number) => {
    await apiPatch("/api/settings", { locationLat: lat, locationLng: lng, deliveryRadiusKm: radius });
    queryClient.invalidateQueries({ queryKey: ["settings"] });
    setShowLocationPicker(false);
    toast({ title: "Store Location Saved", description: `Location and ${radius}km delivery radius updated.` });
  };

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => apiPatch("/api/settings", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPatch(`/api/banners/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
  });

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingBannerId) {
      try {
        const path = `banners/banner_${uploadingBannerId}_${Date.now()}.jpg`;
        const url = await compressAndUploadImage(file, path);
        updateBannerMutation.mutate({ id: uploadingBannerId, data: { image: url } });
        setUploadingBannerId(null);
        toast({ title: "Banner image uploaded" });
      } catch (err: any) {
        toast({ title: "Upload failed", description: err?.message, variant: "destructive" });
      }
    }
    e.target.value = "";
  };
  
  const isLoading = settingsLoading || bannersLoading || menuLoading;
  if (isLoading || !settings) return <LoadingSpinner />;

  const filteredMenu = menu.filter((item: any) => 
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  );

  const updateSettings = (data: any) => {
    updateSettingsMutation.mutate(data);
  };

  const updateBanner = (id: number, data: any) => {
    updateBannerMutation.mutate({ id, data });
  };

  return (
    <div className="min-h-screen bg-neutral-900 pb-20 text-neutral-100 flex flex-col">
       <StoreLocationPicker
         open={showLocationPicker}
         onClose={() => setShowLocationPicker(false)}
         initialLat={settings.locationLat}
         initialLng={settings.locationLng}
         radiusKm={settings.deliveryRadiusKm}
         onSave={handleSaveStoreLocation}
       />
       <div className="p-6 bg-neutral-900 sticky top-0 z-30 border-b border-neutral-800">
         <h1 className="font-heading font-bold text-xl">Store Settings</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
         <div className="space-y-6">
            <h2 className="text-lg font-bold border-b border-neutral-700 pb-2">Store Info</h2>
             <div className="space-y-2">
                <Label>Store Name</Label>
                <Input className="bg-neutral-800 border-neutral-700" value={settings.storeName} onChange={(e) => updateSettings({ storeName: e.target.value })} />
             </div>
             
             <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between bg-neutral-800 p-4 rounded-lg border border-neutral-700">
                   <div>
                      <Label className="text-base font-bold">Store Status</Label>
                      <p className="text-xs text-foreground/40 mt-1">
                        {settings.isOpen ? "Currently Open for Orders" : "Store is Closed"}
                      </p>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold uppercase", settings.isOpen ? "text-green-500" : "text-red-500")}>
                        {settings.isOpen ? "OPEN" : "CLOSED"}
                      </span>
                      <Switch 
                        checked={settings.isOpen} 
                        onCheckedChange={(checked) => updateSettings({ isOpen: checked })}
                        className="data-[state=checked]:bg-green-600"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Open Time</Label>
                      <Input 
                        type="time" 
                        className="bg-neutral-800 border-neutral-700" 
                        value={settings.openTime} 
                        onChange={(e) => updateSettings({ openTime: e.target.value })} 
                      />
                   </div>
                   <div className="space-y-2">
                      <Label>Close Time</Label>
                      <Input 
                        type="time" 
                        className="bg-neutral-800 border-neutral-700" 
                        value={settings.closeTime} 
                        onChange={(e) => updateSettings({ closeTime: e.target.value })} 
                      />
                   </div>
                </div>

                {!settings.isOpen && (
                  <div className="space-y-2">
                      <Label>Next Opening Message</Label>
                      <Input 
                        className="bg-neutral-800 border-neutral-700" 
                        placeholder="e.g. We open at 5 PM today"
                        value={settings.nextOpenMessage} 
                        onChange={(e) => updateSettings({ nextOpenMessage: e.target.value })} 
                      />
                      <p className="text-xs text-foreground/60">Shown to customers when store is closed.</p>
                  </div>
                )}
             </div>

             <div className="space-y-2">
                <Label>UPI ID (For Payments)</Label>
                <Input className="bg-neutral-800 border-neutral-700" value={settings.upiId} onChange={(e) => updateSettings({ upiId: e.target.value })} />
                <p className="text-xs text-foreground/60">Customers will send payments to this ID.</p>
             </div>
             
             <div className="space-y-2">
                <Label>Store Location & Delivery Radius</Label>
                <div className="bg-neutral-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-foreground/40">
                      <p>Lat: {settings.locationLat.toFixed(4)}, Lng: {settings.locationLng.toFixed(4)}</p>
                      <p>Radius: {settings.deliveryRadiusKm} km</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-neutral-700" onClick={() => setShowLocationPicker(true)}>
                      <MapPin className="w-4 h-4 mr-1" /> Update
                    </Button>
                  </div>
                </div>
             </div>
         </div>

         <div className="space-y-6">
            <h2 className="text-lg font-bold border-b border-neutral-700 pb-2">App Banners</h2>
            <div className="space-y-6">
              {banners.map((banner: any, index: number) => (
                <div key={banner.id} className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 space-y-4">
                   <div className="flex justify-between items-center">
                     <h3 className="font-bold text-sm text-primary">Banner {index + 1}</h3>
                     <div className={cn("w-4 h-4 rounded-full bg-gradient-to-r", banner.gradient)}></div>
                   </div>
                   
                   <div className="grid gap-2">
                      <Label className="text-xs">Title</Label>
                      <Input 
                        className="bg-neutral-900 border-neutral-700 h-8 text-sm" 
                        value={banner.title} 
                        onChange={(e) => updateBanner(banner.id, { title: e.target.value })} 
                      />
                   </div>
                   
                   <div className="grid gap-2">
                      <Label className="text-xs">Subtitle</Label>
                      <Input 
                        className="bg-neutral-900 border-neutral-700 h-8 text-sm" 
                        value={banner.subtitle} 
                        onChange={(e) => updateBanner(banner.id, { subtitle: e.target.value })} 
                      />
                   </div>

                   <div className="grid gap-2">
                      <Label className="text-xs">Color Gradient</Label>
                      <select 
                        className="bg-neutral-900 border border-neutral-700 rounded-md h-8 text-sm px-2 text-neutral-200"
                        value={banner.gradient}
                        onChange={(e) => updateBanner(banner.id, { gradient: e.target.value })}
                      >
                         <option value="from-orange-500 to-red-500">Orange & Red</option>
                         <option value="from-blue-500 to-purple-600">Blue & Purple</option>
                         <option value="from-green-600 to-emerald-800">Green & Emerald</option>
                         <option value="from-neutral-900 to-neutral-800">Black & Dark Gray</option>
                         <option value="from-yellow-400 to-orange-500">Yellow & Orange</option>
                         <option value="from-pink-500 to-rose-500">Pink & Rose</option>
                      </select>
                   </div>

                   <div className="grid gap-2">
                      <Label className="text-xs">Banner Image (Optional)</Label>
                      {banner.image ? (
                        <div className="space-y-2">
                           <div className="w-full h-32 rounded-lg overflow-hidden">
                              <img src={banner.image} alt="Banner" className="w-full h-full object-cover" />
                           </div>
                           <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="flex-1 h-8 text-xs" 
                                onClick={() => { setUploadingBannerId(banner.id); bannerImageRef.current?.click(); }}
                              >
                                <Upload className="w-3 h-3 mr-1" /> Change
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="flex-1 h-8 text-xs" 
                                onClick={() => updateBanner(banner.id, { image: "" })}
                              >
                                <X className="w-3 h-3 mr-1" /> Remove
                              </Button>
                           </div>
                        </div>
                      ) : (
                        <div 
                          className="w-full h-20 border-2 border-dashed border-neutral-700 rounded-lg flex flex-col items-center justify-center text-foreground/60 hover:text-neutral-300 hover:border-neutral-500 cursor-pointer transition-colors"
                          onClick={() => { setUploadingBannerId(banner.id); bannerImageRef.current?.click(); }}
                        >
                           <ImageIcon className="w-5 h-5 mb-1" />
                           <span className="text-[10px]">Upload Image</span>
                        </div>
                      )}
                      <p className="text-[10px] text-foreground/60">Recommended size: 800x400px (2:1 aspect ratio)</p>
                   </div>

                   <div className="pt-2">
                      <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => setSelectedBannerId(banner.id)}>
                        <Settings className="w-3 h-3 mr-2" />
                        Manage Linked Items ({banner.linkedItemIds?.length || 0})
                      </Button>
                   </div>
                </div>
              ))}
            </div>
            
            <input 
              type="file" 
              accept="image/*"
              ref={bannerImageRef}
              className="hidden"
              onChange={handleBannerImageUpload}
            />
         </div>

         <Dialog open={!!selectedBannerId} onOpenChange={(open) => !open && setSelectedBannerId(null)}>
            <DialogContent className="bg-neutral-800 border-neutral-700 text-neutral-100 max-h-[80vh] overflow-y-auto flex flex-col">
               <DialogHeader>
                  <DialogTitle>Link Items to Banner</DialogTitle>
                  <CardDescription>Select items that will show when this banner is clicked.</CardDescription>
               </DialogHeader>
               
               <div className="sticky top-0 bg-neutral-800 z-10 py-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <Input 
                      className="pl-9 bg-neutral-900 border-neutral-700 text-sm" 
                      placeholder="Search items..." 
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                    />
                  </div>
               </div>

               <div className="space-y-2 py-2 flex-1 overflow-y-auto">
                  {filteredMenu.length > 0 ? (
                    filteredMenu.map((item: any) => {
                       const isSelected = banners.find((b: any) => b.id === selectedBannerId)?.linkedItemIds?.includes(item.id);
                       return (
                          <div key={item.id} className="flex items-center space-x-3 p-2 rounded hover:bg-neutral-700">
                             <input 
                               type="checkbox" 
                               checked={!!isSelected}
                               onChange={() => {
                                  const currentBanner = banners.find((b: any) => b.id === selectedBannerId);
                                  if (!currentBanner) return;
                                  
                                  const currentIds = currentBanner.linkedItemIds || [];
                                  let newIds;
                                  if (isSelected) {
                                     newIds = currentIds.filter((id: number) => id !== item.id);
                                  } else {
                                     newIds = [...currentIds, item.id];
                                  }
                                  updateBanner(currentBanner.id, { linkedItemIds: newIds });
                               }}
                               className="w-4 h-4 accent-primary"
                             />
                             <div className="flex-1">
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-foreground/40">₹{item.price}</p>
                             </div>
                          </div>
                       );
                    })
                  ) : (
                    <div className="text-center py-8 text-foreground/60">
                       <p>No items found</p>
                    </div>
                  )}
               </div>
            </DialogContent>
         </Dialog>

         <div className="p-4 bg-neutral-800 rounded-xl border border-neutral-700 mt-8">
            <h3 className="font-bold mb-2 text-primary">Mock Verification</h3>
            <p className="text-sm text-foreground/40">
              In a real app, UPI payments would be verified via bank SMS parsing or Payment Gateway Webhooks. 
              Here, you manually check your bank app and approve the order in the "Orders" tab.
            </p>
         </div>
      </div>

      <MerchantNav />
    </div>
  );
}

function MerchantCustomers() {
  const { data: customers = [], isLoading } = useQuery(customersQueryOptions);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const toggleBlockMutation = useMutation({
    mutationFn: (phone: string) => apiPatch(`/api/customers/${phone}/block`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  const handleToggleBlock = (customer: any) => {
    toggleBlockMutation.mutate(customer.phoneNumber);
    toast({
      title: customer.isBlocked ? "User Unblocked" : "User Blocked",
      description: `${customer.name || customer.phoneNumber} has been ${customer.isBlocked ? "unblocked" : "blocked"}.`,
      variant: customer.isBlocked ? "default" : "destructive",
    });
  };

  if (isLoading) return <LoadingSpinner />;

  const filteredCustomers = customers.filter((c: any) => 
    c.phoneNumber.includes(searchQuery) || 
    (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-neutral-900 pb-20 text-neutral-100 flex flex-col">
       <div className="p-6 bg-neutral-900 sticky top-0 z-30 border-b border-neutral-800 space-y-4">
         <h1 className="font-heading font-bold text-xl">Customers</h1>
         
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60" />
            <Input 
              className="pl-9 bg-neutral-800 border-neutral-700 text-sm h-10" 
              placeholder="Search by phone number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-20 opacity-50">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <p>{searchQuery ? "No customers found" : "No customers yet"}</p>
          </div>
        ) : (
          filteredCustomers.map((customer: any, idx: number) => (
             <div key={idx} className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                  {customer.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                   <h3 className="font-bold truncate">{customer.name || "Unknown"}</h3>
                   <p className="text-sm text-foreground/40 mt-1">{customer.phoneNumber}</p>
                   {customer.address && <p className="text-xs text-foreground/60 mt-2 line-clamp-2">{customer.address}</p>}
                   {customer.locationLat && (
                     <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
                       <MapPin className="w-3 h-3" />
                       <span>Location set</span>
                     </div>
                   )}
                   {customer.isBlocked && (
                     <div className="flex items-center gap-1 mt-2 text-xs text-red-500 font-bold">
                       <Ban className="w-3 h-3" />
                       <span>BLOCKED</span>
                     </div>
                   )}
                </div>
                <Button 
                  size="sm" 
                  variant={customer.isBlocked ? "secondary" : "destructive"} 
                  className={cn("h-8 text-xs", customer.isBlocked ? "bg-green-600 hover:bg-green-700 text-white border-none" : "")}
                  onClick={() => handleToggleBlock(customer)}
                >
                  {customer.isBlocked ? "Unblock" : "Block"}
                </Button>
             </div>
          ))
        )}
      </div>
      <MerchantNav />
    </div>
  );
}

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <video 
        ref={videoRef}
        src={splashVideo} 
        autoPlay 
        muted 
        playsInline
        className="w-full h-full object-cover"
        onEnded={onFinish}
      />
    </div>
  );
}

// --- Main App Switcher ---

function App() {
  const viewMode = useStore((state) => state.viewMode);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const isMerchantAuthenticated = useStore((state) => state.isMerchantAuthenticated);
  const user = useStore(state => state.user);
  const [showSplash, setShowSplash] = useState(import.meta.env.PROD);

  if (showSplash) {
    return (
      <div className="font-sans antialiased text-foreground bg-background selection:bg-primary/20">
         <AppShell>
            <SplashScreen onFinish={() => setShowSplash(false)} />
         </AppShell>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased text-foreground bg-background selection:bg-primary/20">
      <AppShell>
        {!isAuthenticated && !isMerchantAuthenticated ? (
          <LoginPage />
        ) : isMerchantAuthenticated && viewMode === "merchant" ? (
          <RouteSwitch>
            <Route path="/merchant" component={MerchantDashboard} />
            <Route path="/merchant/menu" component={MerchantMenu} />
            <Route path="/merchant/settings" component={MerchantSettings} />
            <Route path="/merchant/customers" component={MerchantCustomers} />
            <Route component={MerchantDashboard} />
          </RouteSwitch>
        ) : !isAuthenticated ? (
          <LoginPage />
        ) : viewMode === "customer" ? (
          <RouteSwitch>
            <Route path="/profile-setup" component={ProfileSetupPage} />
            {!user?.name ? (
               <Route component={ProfileSetupPage} />
            ) : (
              <RouteSwitch>
                <Route path="/" component={CustomerHome} />
                <Route path="/cart" component={CustomerCart} />
                <Route path="/menu" component={CustomerMenu} />
                <Route path="/orders" component={CustomerOrders} />
                <Route path="/profile" component={CustomerProfile} />
                <Route path="/terms" component={CustomerTerms} />
                <Route path="/privacy-policy" component={CustomerPrivacyPolicy} />
                <Route path="/refund-policy" component={CustomerRefundPolicy} />
                <Route path="/delivery-policy" component={CustomerDeliveryPolicy} />
                <Route path="/contact" component={CustomerContact} />
                <Route path="/categories" component={CustomerCategories} />
                <Route path="/category/:category" component={CustomerCategoryItems} />
                <Route path="/banner/:bannerId" component={CustomerBannerItems} />
                <Route component={CustomerHome} />
              </RouteSwitch>
            )}
          </RouteSwitch>
        ) : null}
      </AppShell>
      <Toaster />
    </div>
  );
}

export default App;
