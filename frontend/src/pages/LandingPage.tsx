import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LoginModal } from "@/components/LoginModal";
import { useAuth } from "@/contexts/AuthContext";

const LandingPage = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { isAuthenticated, handleGoogleLogin } = useAuth();
  const navigate = useNavigate();

  const handleStartPracticing = () => {
    if (isAuthenticated) {
      navigate('/practice');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = async (credentialResponse: any) => {
    await handleGoogleLogin(credentialResponse);
    setIsLoginModalOpen(false);
    navigate('/practice');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header activeSection="Home" />
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={handleLoginSuccess} 
      />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 pointer-events-none"></div>
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <div className="inline-block mb-4 px-4 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
              SAT & IELTS Preparation
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Achieve Your 120% Potential
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 text-muted-foreground">
              Master SAT and IELTS with our advanced learning platform. Enhance your scores and maximize your university admission chances.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={handleStartPracticing}
              >
                Start Practicing
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#features">Learn More</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 px-6 bg-muted/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose 120% Potential?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                title="Advanced Spaced Repetition"
                description="Our SRS algorithm adapts to your performance, focusing on areas that need improvement - as effective as Anki."
                icon="🔄"
              />
              <FeatureCard 
                title="User-Friendly Interface"
                description="Convenient and intuitive interface designed for efficient learning, making daily practice easy and engaging."
                icon="👍"
              />
              <FeatureCard 
                title="AI-Powered Assistance"
                description="Ask AI about questions, text passages, and explanations. Get intelligent help when you need it most."
                icon="🤖"
              />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Student Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <TestimonialCard 
                quote="This platform helped me raise my SAT score by 200 points in just two months of consistent practice."
                author="Alina K."
                title="NU Student"
              />
              <TestimonialCard 
                quote="The spaced repetition system is incredible. I've never retained information this well with any other study method."
                author="Daulet M."
                title="IELTS 8.5"
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 px-6 text-center bg-gradient-to-r from-primary/10 to-purple-600/10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to Maximize Your Potential?</h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Start practicing daily to see significant improvements in your SAT and IELTS scores.
              No need for expensive courses - just consistent effort and our proven system.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleStartPracticing}
            >
              Start Now
            </Button>
          </div>
        </section>
      </main>
      
      <footer className="bg-muted py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">120% Potential</h3>
              <p className="text-sm text-muted-foreground">
                Advanced SAT and IELTS preparation platform designed to maximize your test scores and university admission chances.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Blog</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Study Tips</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Practice Tests</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">About Us</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Contact</a></li>
                <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} 120% Potential. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ title, description, icon }: { title: string; description: string; icon: string }) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border hover:border-primary/20 transition-all duration-300 hover:shadow-md">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

const TestimonialCard = ({ quote, author, title }: { quote: string; author: string; title: string }) => {
  return (
    <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
      <div className="mb-4 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M11.9906 21.0004C16.9529 21.0004 21 16.9532 21 12.0006C21 7.04792 16.9529 3.00073 11.9906 3.00073C7.039 3.00073 3 7.04792 3 12.0006C3 16.9532 7.039 21.0004 11.9906 21.0004Z" opacity="0.1"></path><path d="M9.59352 11.0649C9.92754 10.9314 10.159 10.6083 10.159 10.2317C10.159 9.74664 9.7659 9.3537 9.2808 9.3537C9.01829 9.3537 8.78678 9.46144 8.62528 9.63461C8.14968 10.159 7.85266 10.8357 7.85266 11.5792C7.85266 13.3089 9.01829 14.5847 10.6354 14.5847C12.2526 14.5847 13.6366 13.2006 13.6366 11.0649V10.4657C13.6366 7.75177 11.4463 5.56152 8.73243 5.56152H8.28134C7.79634 5.56152 7.4034 5.95446 7.4034 6.43946C7.4034 6.92446 7.79634 7.3174 8.28134 7.3174H8.73243C10.4744 7.3174 11.8805 8.72354 11.8805 10.4657V11.0649H9.59352Z"></path><path d="M15.7766 11.0649C16.1106 10.9314 16.342 10.6083 16.342 10.2317C16.342 9.74664 15.9491 9.3537 15.464 9.3537C15.2015 9.3537 14.97 9.46144 14.8085 9.63461C14.3329 10.159 14.0359 10.8357 14.0359 11.5792C14.0359 13.3089 15.2015 14.5847 16.8187 14.5847C18.4359 14.5847 19.8199 13.2006 19.8199 11.0649V10.4657C19.8199 7.75177 17.6296 5.56152 14.9156 5.56152H14.4645C13.9795 5.56152 13.5866 5.95446 13.5866 6.43946C13.5866 6.92446 13.9795 7.3174 14.4645 7.3174H14.9156C16.6577 7.3174 18.0638 8.72354 18.0638 10.4657V11.0649H15.7766Z"></path></svg>
      </div>
      <p className="mb-4 italic">{quote}</p>
      <div>
        <p className="font-medium">{author}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
};

export default LandingPage;
