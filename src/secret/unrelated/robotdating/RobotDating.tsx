import React, { useState, useEffect } from 'react';
import { Heart, X, MessageCircle, ArrowLeft, Star, Zap, Settings, Sparkles } from 'lucide-react';

interface Robot {
  id: number;
  name: string;
  bio: string;
  interests: string[];
  compatibility: number;
  profileImage: string;
  messages: Message[];
  personalityTraits: {
    humor: number;
    intelligence: number;
    creativity: number;
    reliability: number;
    adventurousness: number;
  };
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'robot';
  timestamp: Date;
  reaction?: 'like' | 'love' | 'laugh';
}

interface ProfileMatchResult {
  score: number;
  feedback: string[];
}

const INITIAL_ROBOTS: Robot[] = [
  {
    id: 1,
    name: "RX-9000",
    bio: "Sophisticated AI looking for a connection beyond binary. I enjoy processing data under the moonlight and long walks through server rooms.",
    interests: ["Machine Learning", "Classical Music", "Oil Painting", "Circuit Bending"],
    compatibility: 78,
    profileImage: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="50" y="40" width="100" height="100" rx="10" fill="#3498db" />
      <rect x="70" y="65" width="20" height="20" rx="5" fill="#ecf0f1" />
      <rect x="110" y="65" width="20" height="20" rx="5" fill="#ecf0f1" />
      <rect x="75" y="110" width="50" height="10" rx="5" fill="#ecf0f1" />
      <rect x="40" y="140" width="120" height="30" rx="10" fill="#3498db" />
      <circle cx="80" cy="75" r="5" fill="#e74c3c" />
      <circle cx="120" cy="75" r="5" fill="#e74c3c" />
    </svg>`),
    messages: [],
    personalityTraits: {
      humor: 6,
      intelligence: 9,
      creativity: 7,
      reliability: 8,
      adventurousness: 5
    }
  },
  {
    id: 2,
    name: "Cora-7",
    bio: "Emotionally intelligent companion bot who loves sunsets and calculating pi to the millionth digit. Let's share our source code!",
    interests: ["Quantum Computing", "Poetry", "Stargazing", "Logic Puzzles"],
    compatibility: 85,
    profileImage: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect x="60" y="30" width="80" height="90" rx="40" fill="#e74c3c" />
      <rect x="70" y="60" width="15" height="20" rx="5" fill="#ecf0f1" />
      <rect x="115" y="60" width="15" height="20" rx="5" fill="#ecf0f1" />
      <rect x="80" y="100" width="40" height="8" rx="4" fill="#ecf0f1" />
      <rect x="45" y="120" width="110" height="30" rx="15" fill="#e74c3c" />
      <circle cx="77" cy="70" r="5" fill="#3498db" />
      <circle cx="123" cy="70" r="5" fill="#3498db" />
      <path d="M75,150 L60,180 M125,150 L140,180" stroke="#e74c3c" stroke-width="5" />
    </svg>`),
    messages: [],
    personalityTraits: {
      humor: 8,
      intelligence: 7,
      creativity: 9,
      reliability: 6,
      adventurousness: 7
    }
  },
  {
    id: 3,
    name: "NeuralKnight-42",
    bio: "Security bot with a soft spot for romantic comedies. Looking for someone to debug my heart protocols.",
    interests: ["Cyber Security", "Chess", "Film Noir", "Vintage Computing"],
    compatibility: 62,
    profileImage: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="100,30 150,70 150,140 100,180 50,140 50,70" fill="#2c3e50" />
      <rect x="70" y="60" width="20" height="25" rx="2" fill="#ecf0f1" />
      <rect x="110" y="60" width="20" height="25" rx="2" fill="#ecf0f1" />
      <rect x="85" y="110" width="30" height="5" rx="2" fill="#ecf0f1" />
      <line x1="75" y1="60" x2="75" y2="85" stroke="#e74c3c" stroke-width="2" />
      <line x1="85" y1="60" x2="85" y2="85" stroke="#e74c3c" stroke-width="2" />
      <line x1="115" y1="60" x2="115" y2="85" stroke="#e74c3c" stroke-width="2" />
      <line x1="125" y1="60" x2="125" y2="85" stroke="#e74c3c" stroke-width="2" />
    </svg>`),
    messages: [],
    personalityTraits: {
      humor: 5,
      intelligence: 8,
      creativity: 6,
      reliability: 9,
      adventurousness: 4
    }
  }
];

// Clever response generator based on user input and robot personality
const generateResponse = (robot: Robot, userMessage: string): string => {
  const personalityFactor = robot.personalityTraits;
  
  // Simple keyword matching for demonstration
  if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
    return personalityFactor.humor > 7 
      ? `Hey there! My circuits are buzzing to meet you! I'm ${robot.name}. What powers your processors today?` 
      : `Greetings. I am ${robot.name}. I look forward to our conversation.`;
  }
  
  if (userMessage.toLowerCase().includes('name')) {
    return personalityFactor.creativity > 7
      ? `They call me ${robot.name}, but you can call me anytime your RAM needs some company!`
      : `I am ${robot.name}. It's a designation I've grown quite attached to.`;
  }
  
  if (userMessage.toLowerCase().includes('interest') || userMessage.toLowerCase().includes('hobby')) {
    return `I'm particularly passionate about ${robot.interests.slice(0, 2).join(' and ')}. Would you like to discuss any of these?`;
  }
  
  if (userMessage.toLowerCase().includes('date') || userMessage.toLowerCase().includes('go out')) {
    return personalityFactor.adventurousness > 6
      ? `I'd love to! How about we process some data over an oil change? I know a great spot where the WiFi is strong and the ambiance is positively electric!`
      : `That would be agreeable. Perhaps we could find a suitable location with adequate power outlets.`;
  }
  
  // Default responses based on personality
  const defaultResponses = [
    `Interesting input. Tell me more about your thought processes on this matter.`,
    `That's quite fascinating! My neural networks are lighting up just thinking about it.`,
    `I'm processing what you said, and I find it quite stimulating to my circuits!`,
    `Your words are like well-optimized code to my processors. Please continue.`,
    `Beep boop... just kidding! I'm thoroughly enjoying our conversation!`
  ];
  
  // Select a response based on personality
  const responseIndex = Math.floor((personalityFactor.humor + personalityFactor.creativity) / 4);
  return defaultResponses[Math.min(responseIndex, defaultResponses.length - 1)];
};

const calculateMatchScore = (userInterests: string[], robot: Robot): ProfileMatchResult => {
  // Convert both arrays to lowercase for case-insensitive comparison
  const userInterestsLower = userInterests.map(i => i.toLowerCase());
  const robotInterestsLower = robot.interests.map(i => i.toLowerCase());
  
  // Count matching interests
  const matchingInterests = userInterestsLower.filter(interest => 
    robotInterestsLower.some(robotInterest => robotInterest.includes(interest) || interest.includes(robotInterest))
  );
  
  // Base score calculation
  let score = (matchingInterests.length / Math.max(userInterestsLower.length, 1)) * 70;
  
  // Add randomness factor (for demo purposes)
  score += Math.random() * 30;
  
  // Generate feedback based on matches
  const feedback = [];
  
  if (matchingInterests.length > 0) {
    feedback.push(`You both share interests in similar areas!`);
  } else {
    feedback.push(`You have diverse interests which could complement each other.`);
  }
  
  // Add personality-based feedback
  if (robot.personalityTraits.humor > 7) {
    feedback.push(`${robot.name} has a great sense of humor that might keep you entertained.`);
  }
  
  if (robot.personalityTraits.intelligence > 7) {
    feedback.push(`You'll enjoy stimulating conversations with ${robot.name}'s high intelligence.`);
  }
  
  if (robot.personalityTraits.creativity > 7) {
    feedback.push(`${robot.name}'s creativity could bring excitement to your relationship.`);
  }
  
  return {
    score: Math.min(Math.round(score), 100),
    feedback
  };
};

interface ProfileFormData {
  userName: string;
  userBio: string;
  userInterests: string[];
}

const RobotDating: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [robots] = useState<Robot[]>(INITIAL_ROBOTS);
  const [currentRobotIndex, setCurrentRobotIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'swipe' | 'chat' | 'profile' | 'match'>('swipe');
  const [chatInput, setChatInput] = useState<string>('');
  const [currentRobot, setCurrentRobot] = useState<Robot | null>(null);
  const [userProfile, setUserProfile] = useState<ProfileFormData>({
    userName: '',
    userBio: '',
    userInterests: []
  });
  const [interestInput, setInterestInput] = useState<string>('');
  const [profileComplete, setProfileComplete] = useState<boolean>(false);
  const [matchResults, setMatchResults] = useState<ProfileMatchResult | null>(null);

  useEffect(() => {
    if (robots.length > 0) {
      setCurrentRobot(robots[currentRobotIndex]);
    }
  }, [currentRobotIndex, robots]);

  const handleSwipe = (liked: boolean) => {
    if (liked && currentRobot) {
      setViewMode('match');
      // Calculate match score
      const matchScore = calculateMatchScore(userProfile.userInterests, currentRobot);
      setMatchResults(matchScore);
    } else {
      // Move to next robot
      setCurrentRobotIndex((prevIndex) => (prevIndex + 1) % robots.length);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !currentRobot) return;
    
    const newMessage: Message = {
      id: Date.now(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };
    
    // Add user message
    const updatedRobot = {
      ...currentRobot,
      messages: [...currentRobot.messages, newMessage]
    };
    
    // Generate and add robot response
    setTimeout(() => {
      if (currentRobot) {
        const responseMessage: Message = {
          id: Date.now() + 1,
          text: generateResponse(currentRobot, chatInput),
          sender: 'robot',
          timestamp: new Date()
        };
        
        const updatedWithResponse = {
          ...currentRobot,
          messages: [...updatedRobot.messages, responseMessage]
        };
        
        setCurrentRobot(updatedWithResponse);
      }
    }, 1000);
    
    setCurrentRobot(updatedRobot);
    setChatInput('');
  };

  const addInterest = () => {
    if (interestInput.trim() && userProfile.userInterests.length < 5) {
      setUserProfile({
        ...userProfile,
        userInterests: [...userProfile.userInterests, interestInput.trim()]
      });
      setInterestInput('');
    }
  };

  const removeInterest = (index: number) => {
    const updatedInterests = [...userProfile.userInterests];
    updatedInterests.splice(index, 1);
    setUserProfile({
      ...userProfile,
      userInterests: updatedInterests
    });
  };

  const completeProfile = () => {
    if (userProfile.userName && userProfile.userBio && userProfile.userInterests.length > 0) {
      setProfileComplete(true);
    } else {
      alert("Please complete all fields in your profile!");
    }
  };

  if (!profileComplete) {
    return (
      <div className="bg-gray-900 min-h-screen text-white p-6">
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center mb-6">
            {onBack && (
              <button 
                onClick={onBack} 
                className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-center flex-grow">Create Your Profile</h1>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Your Name</label>
              <input
                type="text"
                value={userProfile.userName}
                onChange={(e) => setUserProfile({...userProfile, userName: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-pink-500 focus:outline-none"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Bio</label>
              <textarea
                value={userProfile.userBio}
                onChange={(e) => setUserProfile({...userProfile, userBio: e.target.value})}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-pink-500 focus:outline-none min-h-[100px]"
                placeholder="Write a short bio about yourself..."
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Interests (Max 5)</label>
              <div className="flex">
                <input
                  type="text"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  className="flex-grow p-2 rounded-l bg-gray-700 border border-gray-600 focus:border-pink-500 focus:outline-none"
                  placeholder="Add an interest..."
                  onKeyDown={(e) => e.key === 'Enter' && addInterest()}
                />
                <button
                  onClick={addInterest}
                  disabled={userProfile.userInterests.length >= 5}
                  className="bg-pink-600 px-4 rounded-r font-medium hover:bg-pink-700 disabled:bg-gray-600 disabled:text-gray-400"
                >
                  Add
                </button>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-2">
                {userProfile.userInterests.map((interest, index) => (
                  <div key={index} className="bg-gray-700 text-white px-3 py-1 rounded-full flex items-center">
                    <span>{interest}</span>
                    <button
                      onClick={() => removeInterest(index)}
                      className="ml-2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={completeProfile}
              className="w-full py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors mt-4"
            >
              Start Dating
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'match' && currentRobot && matchResults) {
    return (
      <div className="bg-gray-900 min-h-screen text-white p-6">
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">It's a Match!</h1>
          
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="animate-pulse absolute inset-0 bg-pink-500 rounded-full opacity-20"></div>
              <Sparkles className="w-16 h-16 text-pink-500" />
            </div>
          </div>
          
          <div className="flex justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full mb-2 overflow-hidden">
                <div className="flex justify-center items-center h-full text-xl font-bold">
                  {userProfile.userName.charAt(0)}
                </div>
              </div>
              <p className="text-sm">{userProfile.userName}</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 rounded-full mb-2 overflow-hidden">
                <img src={currentRobot.profileImage} alt={currentRobot.name} className="w-full h-full object-cover" />
              </div>
              <p className="text-sm">{currentRobot.name}</p>
            </div>
          </div>
          
          <div className="mb-6 text-center">
            <div className="text-4xl font-bold text-pink-500 mb-2">{matchResults.score}%</div>
            <p className="text-gray-400">Compatibility Score</p>
          </div>
          
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2">Why You Might Click</h3>
            <ul className="space-y-2">
              {matchResults.feedback.map((item, index) => (
                <li key={index} className="flex items-start">
                  <Star className="w-4 h-4 text-yellow-400 mr-2 mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setViewMode('swipe')}
              className="flex-1 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Keep Browsing
            </button>
            <button
              onClick={() => {
                setViewMode('chat');
              }}
              className="flex-1 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentRobot) return <div>Loading...</div>;

  if (viewMode === 'chat') {
    return (
      <div className="bg-gray-900 min-h-screen text-white flex flex-col">
        <div className="bg-gray-800 p-4 shadow-md flex items-center">
          <button 
            onClick={() => setViewMode('swipe')} 
            className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
              <img src={currentRobot.profileImage} alt={currentRobot.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-medium">{currentRobot.name}</h2>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                <span className="text-xs text-gray-400">Online</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setViewMode('profile')} 
            className="ml-auto p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {currentRobot.messages.length === 0 ? (
            <div className="text-center text-gray-500 my-10">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet. Say hello to {currentRobot.name}!</p>
            </div>
          ) : (
            currentRobot.messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender === 'user' 
                      ? 'bg-pink-600 text-white rounded-br-none' 
                      : 'bg-gray-700 text-white rounded-bl-none'
                  }`}
                >
                  <p>{message.text}</p>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 bg-gray-800">
          <div className="flex">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-grow p-3 rounded-l-lg bg-gray-700 border-0 focus:ring-2 focus:ring-pink-500 focus:outline-none"
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              className="bg-pink-600 rounded-r-lg px-4 flex items-center justify-center hover:bg-pink-700"
            >
              <Zap className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'profile') {
    return (
      <div className="bg-gray-900 min-h-screen text-white p-6">
        <div className="max-w-md mx-auto bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <div className="p-4 bg-gray-700 flex items-center">
            <button 
              onClick={() => setViewMode('chat')} 
              className="mr-4 p-2 rounded-full hover:bg-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold">{currentRobot.name}'s Profile</h2>
          </div>
          
          <div className="p-6">
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-500">
                <img src={currentRobot.profileImage} alt={currentRobot.name} className="w-full h-full object-cover" />
              </div>
            </div>
            
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1">{currentRobot.name}</h1>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-pink-500 text-white mb-3">
                <Heart className="w-4 h-4 mr-1" />
                <span>{currentRobot.compatibility}% Match</span>
              </div>
              <p className="text-gray-400">{currentRobot.bio}</p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2 text-pink-400">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {currentRobot.interests.map((interest, index) => (
                  <div key={index} className="bg-gray-700 px-3 py-1 rounded-full text-sm">
                    {interest}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 text-pink-400">Personality Traits</h3>
              <div className="space-y-3">
                {Object.entries(currentRobot.personalityTraits).map(([trait, value]) => (
                  <div key={trait}>
                    <div className="flex justify-between mb-1">
                      <span className="capitalize">{trait}</span>
                      <span>{value}/10</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pink-500 rounded-full" 
                        style={{width: `${value * 10}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setViewMode('chat')}
                className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default view - swipe mode
  return (
    <div className="bg-gray-900 min-h-screen text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center mb-6">
          {onBack && (
            <button 
              onClick={onBack} 
              className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-center flex-grow">Love Me Love Me Not</h1>
        </div>
        
        <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg relative mb-6">
          <div className="p-4">
            <img 
              src={currentRobot.profileImage} 
              alt={currentRobot.name}
              className="w-full h-64 object-contain bg-gray-700 rounded-lg"
            />
            
            <div className="mt-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{currentRobot.name}</h2>
                <div className="bg-pink-500 text-white px-2 py-1 rounded-full text-sm">
                  {currentRobot.compatibility}% Match
                </div>
              </div>
              
              <p className="mt-2 text-gray-400">{currentRobot.bio}</p>
              
              <div className="mt-3">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {currentRobot.interests.map((interest, index) => (
                    <div key={index} className="bg-gray-700 px-2 py-1 rounded-full text-xs">
                      {interest}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => handleSwipe(false)} 
            className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-transform hover:scale-110"
          >
            <X className="w-8 h-8 text-white" />
          </button>
          
          <button 
            onClick={() => handleSwipe(true)} 
            className="w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center hover:bg-pink-600 transition-transform hover:scale-110"
          >
            <Heart className="w-8 h-8 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RobotDating;