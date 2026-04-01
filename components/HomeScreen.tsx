'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Search, AlertCircle, Plus, LogOut, Upload, Image as ImageIcon, 
  Home, User as UserIcon, Share2, FileText, Shield, Moon, Sun, 
  ArrowLeft, MessageCircle, Share, Maximize2, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'motion/react';

interface User {
  name: string;
  mobile: string;
  email: string;
  profilePic: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  image: string;
}

interface HomeScreenProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

export default function HomeScreen({ user, onLogout, onUpdateUser }: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImage, setNewItemImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderImages = [
    'https://picsum.photos/seed/slide1/1200/400',
    'https://picsum.photos/seed/slide2/1200/400',
    'https://picsum.photos/seed/slide3/1200/400',
  ];

  // New Features State
  const [activeScreen, setActiveScreen] = useState<'home' | 'item' | 'terms' | 'privacy' | 'refer' | 'profile'>('home');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editProfilePic, setEditProfilePic] = useState(user.profilePic);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditProfilePic(user.profilePic);
  }, [user]);

  useEffect(() => {
    // Load items from local storage
    const savedItems = JSON.parse(localStorage.getItem('app_items') || '[]');
    Promise.resolve().then(() => setItems(savedItems));

    // Auto slider
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  // Theme effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setNewItemImage(compressedDataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image before saving to prevent localStorage quota issues
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setEditProfilePic(compressedDataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, name: editName, email: editEmail, profilePic: editProfilePic };
    
    try {
      // Update in localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = users.map((u: any) => u.mobile === user.mobile ? updatedUser : u);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // Notify parent
      onUpdateUser(updatedUser);
      alert('Profile updated successfully!');
      openScreen('home');
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. The image might be too large.");
    }
  };

  const handleSaveItem = () => {
    if (!newItemName || !newItemDesc || !newItemImage) {
      alert('Please fill all fields and select an image');
      return;
    }

    const newItem: Item = {
      id: Date.now().toString(),
      name: newItemName,
      description: newItemDesc,
      image: newItemImage,
    };

    try {
      const updatedItems = [newItem, ...items];
      setItems(updatedItems);
      localStorage.setItem('app_items', JSON.stringify(updatedItems));
      
      // Reset form
      setNewItemName('');
      setNewItemDesc('');
      setNewItemImage(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item. The image might be too large.");
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Join me on PinkApp! Use my referral code: ${user.mobile}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleMoreShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PinkApp',
          text: `Join me on PinkApp! Use my referral code: ${user.mobile}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      alert('Web Share API not supported in your browser.');
    }
  };

  const openScreen = (screen: 'home' | 'item' | 'terms' | 'privacy' | 'refer' | 'profile') => {
    setActiveScreen(screen);
    setIsSideMenuOpen(false); // close side menu when navigating
  };

  const renderItemDetails = () => (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center p-4 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <Button variant="ghost" size="icon" onClick={() => setActiveScreen('home')} className="rounded-full">
          <ArrowLeft />
        </Button>
        <h2 className="ml-4 text-xl font-semibold dark:text-gray-100">Details</h2>
      </div>
      <div className="p-4 flex-1">
        <div 
          className="w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden relative cursor-pointer shadow-sm"
          onClick={() => setIsImageZoomed(true)}
        >
          <img src={selectedItem?.image} alt={selectedItem?.name} className="w-full h-full object-cover" />
          <div className="absolute bottom-3 right-3 bg-black/50 p-2.5 rounded-full text-white backdrop-blur-sm">
            <Maximize2 size={20} />
          </div>
        </div>
        <h1 className="text-3xl font-bold mt-6 text-pink-600 dark:text-pink-500">{selectedItem?.name}</h1>
        <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
          {selectedItem?.description}
        </p>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center p-4 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <Button variant="ghost" size="icon" onClick={() => setActiveScreen('home')} className="rounded-full">
          <ArrowLeft />
        </Button>
        <h2 className="ml-4 text-xl font-semibold dark:text-gray-100">Terms & Conditions</h2>
      </div>
      <div className="p-6 prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        <h3 className="text-pink-600 dark:text-pink-500 text-2xl font-bold mb-4">1. Introduction</h3>
        <p className="mb-4">Welcome to PinkApp. By using our application, you agree to these terms and conditions. Please read them carefully.</p>
        <h3 className="text-pink-600 dark:text-pink-500 text-2xl font-bold mb-4 mt-8">2. User Accounts</h3>
        <p className="mb-4">You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
        <h3 className="text-pink-600 dark:text-pink-500 text-2xl font-bold mb-4 mt-8">3. Content</h3>
        <p className="mb-4">Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material.</p>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center p-4 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <Button variant="ghost" size="icon" onClick={() => setActiveScreen('home')} className="rounded-full">
          <ArrowLeft />
        </Button>
        <h2 className="ml-4 text-xl font-semibold dark:text-gray-100">Privacy Policy</h2>
      </div>
      <div className="p-6 prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
        <h3 className="text-pink-600 dark:text-pink-500 text-2xl font-bold mb-4">1. Data Collection</h3>
        <p className="mb-4">We collect information to provide better services to all our users. We collect information in the following ways: information you give us, and information we get from your use of our services.</p>
        <h3 className="text-pink-600 dark:text-pink-500 text-2xl font-bold mb-4 mt-8">2. Data Usage</h3>
        <p className="mb-4">We use the information we collect from all our services to provide, maintain, protect and improve them, to develop new ones, and to protect PinkApp and our users.</p>
        <h3 className="text-pink-600 dark:text-pink-500 text-2xl font-bold mb-4 mt-8">3. Information Sharing</h3>
        <p className="mb-4">We do not share personal information with companies, organizations and individuals outside of PinkApp unless one of the following circumstances applies: with your consent, for external processing, or for legal reasons.</p>
      </div>
    </div>
  );

  const renderRefer = () => (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center p-4 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <Button variant="ghost" size="icon" onClick={() => setActiveScreen('home')} className="rounded-full">
          <ArrowLeft />
        </Button>
        <h2 className="ml-4 text-xl font-semibold dark:text-gray-100">Refer & Earn</h2>
      </div>
      <div className="p-6 flex flex-col items-center">
        <div className="w-full max-w-sm aspect-video bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl flex items-center justify-center text-white shadow-xl mb-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <h3 className="text-3xl font-bold text-center px-4 relative z-10 leading-tight">Invite Friends &<br/>Earn Rewards!</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-3 font-medium">Your Referral Code</p>
        <div className="border-2 border-dashed border-pink-500 rounded-2xl px-10 py-5 bg-pink-50 dark:bg-pink-950/30 mb-10 shadow-sm">
          <span className="text-4xl font-mono font-bold text-pink-600 dark:text-pink-400 tracking-widest">{user.mobile.slice(-6) || 'PINK24'}</span>
        </div>

        <div className="flex gap-4 w-full max-w-sm mb-12">
          <Button onClick={handleWhatsAppShare} className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl h-14 text-lg shadow-md transition-transform active:scale-95">
            <MessageCircle className="mr-2" size={24} /> WhatsApp
          </Button>
          <Button onClick={handleMoreShare} variant="outline" className="flex-1 rounded-2xl h-14 text-lg border-pink-200 text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950 shadow-sm transition-transform active:scale-95">
            <Share className="mr-2" size={24} /> More
          </Button>
        </div>

        <div className="w-full max-w-sm p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-md border border-gray-100 dark:border-gray-700">
          <h4 className="font-semibold mb-4 text-center text-gray-800 dark:text-gray-200">Have a referral code?</h4>
          <div className="flex gap-3">
            <Input 
              placeholder="Enter code here" 
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value)}
              className="focus-visible:ring-pink-500 h-12 rounded-xl text-center font-mono text-lg tracking-widest"
            />
            <Button className="bg-pink-500 hover:bg-pink-600 text-white h-12 px-6 rounded-xl font-semibold">Submit</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="flex items-center p-4 border-b dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <Button variant="ghost" size="icon" onClick={() => openScreen('home')} className="rounded-full">
          <ArrowLeft />
        </Button>
        <h2 className="ml-4 text-xl font-semibold dark:text-gray-100">Update Profile</h2>
      </div>
      <div className="p-6 flex flex-col items-center max-w-md mx-auto w-full space-y-6">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-100 dark:border-pink-900 shadow-lg">
            <img src={editProfilePic} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <button 
            onClick={() => profilePicInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full shadow-lg hover:bg-pink-600 transition-transform active:scale-95"
          >
            <Upload size={20} />
          </button>
          <input 
            type="file" 
            ref={profilePicInputRef} 
            onChange={handleProfilePicUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <div className="w-full space-y-4 mt-8">
          <div className="space-y-2">
            <Label className="dark:text-gray-300">Mobile Number (Read Only)</Label>
            <Input value={user.mobile} disabled className="bg-gray-100 dark:bg-gray-800 text-gray-500 h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editName" className="dark:text-gray-300">Full Name</Label>
            <Input 
              id="editName" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)} 
              className="focus-visible:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 h-12 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editEmail" className="dark:text-gray-300">Email Address</Label>
            <Input 
              id="editEmail" 
              type="email"
              value={editEmail} 
              onChange={(e) => setEditEmail(e.target.value)} 
              className="focus-visible:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 h-12 rounded-xl"
            />
          </div>
          
          <Button 
            onClick={handleSaveProfile} 
            className="w-full bg-pink-500 hover:bg-pink-600 text-white h-12 rounded-xl text-lg font-semibold mt-6 shadow-md"
          >
            Update Profile
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 pb-20 transition-colors duration-300">
      {/* Main Home Screen */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm px-4 py-3 flex flex-col gap-3 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={isSideMenuOpen} onOpenChange={setIsSideMenuOpen}>
              <SheetTrigger render={
                <div className="w-12 h-12 rounded-full overflow-hidden bg-pink-100 border-2 border-pink-200 cursor-pointer hover:border-pink-400 transition-colors">
                  <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                </div>
              } />
              <SheetContent side="left" className="w-[300px] sm:w-[400px] dark:bg-gray-900 p-0 border-r-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex flex-col h-full py-8">
                  <div className="flex items-center gap-4 mb-10 px-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-pink-100 border-2 border-pink-500 shadow-sm">
                      <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h2 className="font-bold text-xl text-gray-800 dark:text-gray-100">{user.name}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{user.mobile}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 flex-1 px-3">
                    <Button variant="ghost" className="w-full justify-start text-lg h-14 rounded-xl hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-gray-800 dark:hover:text-pink-400" onClick={() => openScreen('home')}>
                      <Home className="mr-4" size={24} /> Home
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-lg h-14 rounded-xl hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-gray-800 dark:hover:text-pink-400" onClick={() => openScreen('profile')}>
                      <UserIcon className="mr-4" size={24} /> Profile Update
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-lg h-14 rounded-xl hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-gray-800 dark:hover:text-pink-400" onClick={() => openScreen('refer')}>
                      <Share2 className="mr-4" size={24} /> Share & Refer
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-lg h-14 rounded-xl hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-gray-800 dark:hover:text-pink-400" onClick={() => openScreen('terms')}>
                      <FileText className="mr-4" size={24} /> Terms & Conditions
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-lg h-14 rounded-xl hover:bg-pink-50 hover:text-pink-600 dark:hover:bg-gray-800 dark:hover:text-pink-400" onClick={() => openScreen('privacy')}>
                      <Shield className="mr-4" size={24} /> Privacy Policy
                    </Button>
                  </div>

                  <div className="border-t dark:border-gray-800 pt-6 space-y-4 px-6">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        {isDarkMode ? <Moon size={22} className="text-pink-500" /> : <Sun size={22} className="text-pink-500" />}
                        <span className="font-medium text-lg">Dark Theme</span>
                      </div>
                      <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} className="data-[state=checked]:bg-pink-500" />
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-lg h-14 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={onLogout}>
                      <LogOut className="mr-4" size={24} /> Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">{user.name}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-800 rounded-full transition-colors">
              <AlertCircle size={22} className="text-pink-500" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            type="text" 
            placeholder="Search by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-gray-100 dark:bg-gray-800 border-transparent focus-visible:ring-pink-500 rounded-full h-11 text-base"
          />
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Slider */}
        <section className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden shadow-md">
          {sliderImages.map((src, index) => (
            <div 
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={src} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {sliderImages.map((_, index) => (
              <div 
                key={index} 
                className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-pink-500 w-5' : 'bg-white/70'}`}
              />
            ))}
          </div>
        </section>

        {/* Grid View */}
        <section>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 text-lg px-1">Recent Items</h3>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
              <ImageIcon className="mx-auto mb-3 opacity-20" size={48} />
              <p>No items found. Add a new one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {filteredItems.map(item => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-all cursor-pointer dark:bg-gray-800 rounded-xl active:scale-95"
                  onClick={() => { setSelectedItem(item); openScreen('item'); }}
                >
                  <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-2.5 text-center flex flex-col justify-between h-[76px]">
                    <h4 className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{item.name}</h4>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full h-8 text-xs bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-sm"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setSelectedItem(item); 
                        openScreen('item'); 
                      }}
                    >
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger render={
          <button className="fixed bottom-6 right-6 w-14 h-14 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40">
            <Plus size={28} />
          </button>
        } />
        <DialogContent className="sm:max-w-md dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-pink-600 dark:text-pink-500 text-xl">Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="itemName" className="dark:text-gray-300">Name</Label>
              <Input 
                id="itemName" 
                placeholder="Enter item name" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="focus-visible:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemDesc" className="dark:text-gray-300">Description</Label>
              <Input 
                id="itemDesc" 
                placeholder="Enter description" 
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="focus-visible:ring-pink-500 dark:bg-gray-800 dark:border-gray-700 rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-gray-300">Image</Label>
              <div className="flex items-center gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 dark:hover:bg-gray-800 dark:border-pink-900 rounded-xl h-12 px-6"
                >
                  <Upload size={18} className="mr-2" />
                  Choose File
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                {newItemImage && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-pink-200 dark:border-pink-900 shadow-sm">
                    <img src={newItemImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="mr-2 rounded-xl h-12 px-6 dark:border-gray-700 dark:hover:bg-gray-800" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleSaveItem} className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl h-12 px-8">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Screen Overlays */}
      <AnimatePresence>
        {activeScreen !== 'home' && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white dark:bg-gray-900 overflow-y-auto"
          >
            {activeScreen === 'item' && renderItemDetails()}
            {activeScreen === 'terms' && renderTerms()}
            {activeScreen === 'privacy' && renderPrivacy()}
            {activeScreen === 'refer' && renderRefer()}
            {activeScreen === 'profile' && renderProfile()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Zoom Overlay */}
      <AnimatePresence>
        {isImageZoomed && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setIsImageZoomed(false)}
          >
            <Button variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full z-10" onClick={() => setIsImageZoomed(false)}>
              <X size={28} />
            </Button>
            <motion.img
              src={selectedItem.image}
              alt={selectedItem.name}
              className="w-full h-auto max-h-screen object-contain touch-pan-x touch-pan-y"
              style={{ touchAction: 'pan-x pan-y pinch-zoom' }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
