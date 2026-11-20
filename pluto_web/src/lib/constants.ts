// Event categories matching the existing platform
export const EVENT_CATEGORIES = [
  { id: 'music', label: 'Music', icon: 'Music' },
  { id: 'art', label: 'Art', icon: 'Paintbrush' },
  { id: 'orator', label: 'Orator', icon: 'Mic' },
  { id: 'sports', label: 'Sports', icon: 'Trophy' },
  { id: 'tech', label: 'Tech', icon: 'Code' },
  { id: 'cultural', label: 'Cultural', icon: 'Globe' },
  { id: 'drama', label: 'Drama', icon: 'Drama' },
  { id: 'other', label: 'Other', icon: 'LayoutGrid' },
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]['id']

// Cache durations
export const CACHE_DURATIONS = {
  events: 5 * 60 * 1000,      // 5 minutes
  user: 10 * 60 * 1000,       // 10 minutes
  portfolio: 15 * 60 * 1000,  // 15 minutes
} as const

// Booking fee and GST rates (matching existing platform)
export const BOOKING_FEE_PERCENT = 0.02 // 2%
export const GST_PERCENT = 0.18          // 18% on booking fee

// App metadata
export const APP_NAME = 'PLUTO'
export const APP_DESCRIPTION = 'Your gateway to amazing experiences. Discover and book events happening around you.'

export const INDIAN_STATES_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati", "Kurnool", "Rajahmundry", "Kadapa"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Pasighat", "Ziro", "Bomdila"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tezpur", "Tinsukia"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Ara"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Jagdalpur"],
  "Delhi": ["New Delhi", "Delhi"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar"],
  "Haryana": ["Gurgaon", "Faridabad", "Panipat", "Ambala", "Rohtak", "Hisar", "Karnal", "Panchkula"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Mandi", "Solan", "Kullu", "Palampur"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih"],
  "Karnataka": ["Bangalore", "Mysore", "Mangalore", "Hubli", "Belgaum", "Dharwad", "Gulbarga", "Davanagere"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha", "Kottayam"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Rewa", "Satna"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Thane", "Kolhapur", "Navi Mumbai", "Amravati"],
  "Manipur": ["Imphal", "Churachandpur", "Thoubal", "Bishnupur", "Ukhrul"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Williamnagar"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Puri", "Sambalpur", "Balasore"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar"],
  "Sikkim": ["Gangtok", "Namchi", "Geyzing", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tiruppur", "Erode", "Vellore"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Ambassa"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Noida", "Prayagraj", "Meerut", "Ghaziabad", "Gorakhpur"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh", "Kashipur", "Rudrapur"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol", "Durgapur", "Kharagpur", "Haldia"]
};

// ── Competition Constants ──────────────────────────────────

export const COMPETITION_CATEGORIES = [
  { id: 'hackathon', label: 'Hackathon', icon: 'Code' },
  { id: 'coding_competition', label: 'Coding Competition', icon: 'Terminal' },
  { id: 'case_study', label: 'Case Study Challenge', icon: 'FileText' },
  { id: 'ideathon', label: 'Ideathon', icon: 'Lightbulb' },
] as const

export type CompetitionCategoryId = (typeof COMPETITION_CATEGORIES)[number]['id']

export const SUBMISSION_TYPES = [
  { id: 'none', label: 'No Submission' },
  { id: 'ppt', label: 'PPT / PDF Upload' },
  { id: 'github', label: 'GitHub Repository' },
  { id: 'video', label: 'Demo Video Link' },
  { id: 'link', label: 'Live Deployment URL' },
] as const

export const YEAR_OF_STUDY_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Post Graduate']

export const BRANCH_OPTIONS = [
  'Computer Science', 'Information Technology', 'Electronics', 'Mechanical',
  'Civil', 'Electrical', 'Chemical', 'Biotech', 'MBA', 'BCA', 'Other'
]

export const THEME_SUGGESTIONS = [
  'AI / ML', 'Web3 / Blockchain', 'FinTech', 'HealthTech',
  'Sustainability', 'Open Innovation', 'IoT', 'Cybersecurity',
  'EdTech', 'AgriTech', 'AR / VR', 'SaaS'
]

export const COMPETITION_PLATFORM_FEE_PERCENT = 0.025 // 2.5%
