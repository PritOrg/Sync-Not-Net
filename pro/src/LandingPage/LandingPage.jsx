import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Lock, 
  Edit3, 
  Zap, 
  Users, 
  History, 
  FileText,
  Code,
  Share2,
  Shield,
  Globe,
  Coffee,
  Check,
  Star,
  LucideIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Testimonial component for social proof
const Testimonial = ({ name, role, company, content, avatar }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full"
    >
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-4">
          <img src={avatar || "/api/placeholder/48/48"} alt={name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="font-bold text-lg">{name}</h4>
          <p className="text-sm text-gray-600">{role}, {company}</p>
        </div>
      </div>
      <p className="text-gray-700 italic flex-grow">{content}</p>
      <div className="flex mt-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
        ))}
      </div>
    </motion.div>
  );
};

// Feature card component with enhanced hover effects
const FeatureCard = ({ icon: Icon, title, desc, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="h-full"
    >
      <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col items-center transition-all duration-300 hover:shadow-xl hover:translate-y-[-8px] hover:bg-blue-50">
        <div className="p-4 rounded-full bg-blue-100 mb-4">
          <Icon size={32} className="text-blue-600" />
        </div>
        <h3 className="text-xl font-bold mb-3 text-center">{title}</h3>
        <p className="text-gray-600 text-center">{desc}</p>
      </div>
    </motion.div>
  );
};

// Animated collaborative editor demo
const LiveDemo = () => {
  const [demoText, setDemoText] = useState('');
  const collaborators = [
    { name: 'Alice', color: 'bg-blue-500' },
    { name: 'Bob', color: 'bg-green-500' },
    { name: 'Charlie', color: 'bg-purple-500' },
    { name: 'Dana', color: 'bg-yellow-500' }
  ];

  useEffect(() => {
    const texts = [
      'Welcome to Sync Note Net...',
      'Multiple users editing simultaneously...',
      'See changes in real-time as they happen...',
      'Collaborate effortlessly across devices...',
      'Share notes with your entire team instantly...'
    ];
    let i = 0;
    
    const interval = setInterval(() => {
      setDemoText(texts[i]);
      i = (i + 1) % texts.length;
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-16 relative">
      <div className="absolute top-0 right-6 flex -space-x-2">
        {collaborators.map((user, index) => (
          <div key={user.name} className="relative group">
            <div className={`w-10 h-10 ${user.color} rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-md`}>
              {user.name[0]}
            </div>
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {user.name} is online
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
        <div className="bg-gray-100 py-2 px-4 border-b border-gray-200 flex items-center">
          <div className="flex space-x-2 mr-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs text-gray-500 flex-grow text-center">Untitled Note - Sync Note Net</div>
        </div>
        <div className="p-6 min-h-[300px]">
          <div className="flex items-center gap-2 mb-4">
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded text-sm transition-colors">Heading</button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded text-sm transition-colors">Bold</button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded text-sm transition-colors">List</button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded text-sm transition-colors">Code</button>
            <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded text-sm transition-colors">Link</button>
          </div>
          <p className="text-lg">
            {demoText}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block"
            >
              |
            </motion.span>
          </p>
        </div>
      </div>
    </div>
  );
};

// Pricing tier component
const PricingTier = ({ name, price, features, highlighted = false }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden border ${highlighted ? 'border-blue-500 transform scale-105' : 'border-gray-200'}`}>
      <div className={`py-6 px-6 text-center ${highlighted ? 'bg-blue-600 text-white' : 'bg-gray-50'}`}>
        <h3 className="text-2xl font-bold">{name}</h3>
        <div className="mt-4">
          <span className="text-4xl font-bold">${price}</span>
          <span className="text-sm"> /month</span>
        </div>
      </div>
      <div className="p-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check size={20} className={`mr-2 mt-0.5 ${highlighted ? 'text-blue-500' : 'text-green-500'}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <button className={`w-full py-3 rounded-lg font-bold mt-6 transition-colors ${
          highlighted 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}>
          {highlighted ? 'Get Started' : 'Choose Plan'}
        </button>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const features = [
    { 
      icon: Zap, 
      title: "Real-time Collaboration", 
      desc: "Work together seamlessly with live cursors, presence indicators, and instant updates as your team creates together." 
    },
    { 
      icon: Lock, 
      title: "Enterprise-grade Security", 
      desc: "Keep your sensitive information safe with end-to-end encryption, password protection, and secure sharing controls." 
    },
    { 
      icon: Edit3, 
      title: "Powerful Rich Text Editor", 
      desc: "Create beautiful documents with our intuitive WYSIWYG editor supporting images, tables, and advanced formatting." 
    },
    { 
      icon: Code, 
      title: "Developer Friendly", 
      desc: "Built-in code editor with syntax highlighting and support for over 30 programming languages." 
    },
    { 
      icon: Shield, 
      title: "Granular Access Control", 
      desc: "Set precise permissions with role-based access management for viewing, editing, and sharing." 
    },
    { 
      icon: Globe, 
      title: "Accessible Anywhere", 
      desc: "Access your notes from any device with our responsive web app, desktop clients, and mobile applications." 
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Product Manager",
      company: "TechCorp",
      content: "Sync Note Net transformed how our product team collaborates. Real-time editing eliminated version control issues, and we've seen a 40% improvement in our documentation process."
    },
    {
      name: "David Chen",
      role: "Engineering Lead",
      company: "DevStream",
      content: "As a remote team, we needed a reliable way to share code snippets and technical documentation. Sync Note Net's code editor and real-time collaboration features are game-changers."
    },
    {
      name: "Maya Patel",
      role: "Creative Director",
      company: "DesignHub",
      content: "Our creative briefs and project documentation live in Sync Note Net now. The ability to collaborate in real-time while keeping our assets organized has streamlined our entire workflow."
    }
  ];

  const pricingTiers = [
    {
      name: "Basic",
      price: "0",
      features: [
        "Up to 3 team members",
        "5 shared notebooks",
        "Basic text formatting",
        "7-day history"
      ]
    },
    {
      name: "Professional",
      price: "12",
      highlighted: true,
      features: [
        "Up to 15 team members",
        "Unlimited notebooks",
        "Advanced formatting & media",
        "Code editor with syntax highlighting",
        "30-day history",
        "Priority support"
      ]
    },
    {
      name: "Enterprise",
      price: "29",
      features: [
        "Unlimited team members",
        "Unlimited notebooks",
        "Advanced security controls",
        "Admin dashboard",
        "1-year history",
        "API access",
        "Dedicated support"
      ]
    }
  ];

  return (
    <main className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-repeat" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        </div>
        <div className="container mx-auto px-4 py-16 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
              Where Teams Collaborate and Create Together
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              The intelligent note-taking platform built for modern teams to capture, share, and transform ideas in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/SignInSignUp" className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-8 rounded-lg shadow-lg transition-colors transform hover:scale-105 duration-200">
                Start For Free
              </Link>
              <a href="#" className="border-2 border-white text-white hover:bg-white hover:text-blue-700 font-bold py-3 px-8 rounded-lg transition-colors">
                Watch Demo
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-center">
            <div className="w-full md:w-1/3 p-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">Active Teams</div>
            </div>
            <div className="w-full md:w-1/3 p-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">2.5M+</div>
              <div className="text-gray-600">Notes Created</div>
            </div>
            <div className="w-full md:w-1/3 p-4">
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Demo Section */}
      <div className="py-16 container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See Real-time Collaboration In Action</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Watch how Sync Note Net transforms the way your team works together, making collaboration seamless and effortless.
          </p>
        </div>
        <LiveDemo />
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need In One Place</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Packed with powerful features designed to streamline your team's workflow and enhance productivity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                {...feature} 
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by Teams Everywhere</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              See what our customers have to say about how Sync Note Net has transformed their workflows.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Testimonial 
                key={index} 
                {...testimonial} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose the plan that works best for your team. All plans include a 14-day free trial.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <PricingTier 
                key={index} 
                {...tier} 
              />
            ))}
          </div>
          <div className="text-center mt-10 text-gray-600">
            All plans include unlimited personal notebooks and basic formatting features.
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-xl overflow-hidden">
            <div className="p-10 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Transform How Your Team Collaborates?</h2>
              <p className="text-xl mb-8">
                Join thousands of teams already using Sync Note Net to work better together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your work email" 
                  className="flex-grow py-3 px-4 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300" 
                />
                <button className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg transition-colors whitespace-nowrap">
                  Start Free Trial
                </button>
              </div>
              <p className="mt-4 text-sm text-blue-100">
                No credit card required · 14-day free trial · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}