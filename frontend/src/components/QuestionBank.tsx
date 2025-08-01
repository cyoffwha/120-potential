import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuestionBankProps {
  questionId?: string;
  totalQuestions?: number;
  currentDomain?: string;
  currentSkill?: string;
  currentDifficulty?: string;
  onFiltersChange?: (filters: { domain: string; skill: string; difficulty: string }) => void;
}

export const QuestionBank = ({ 
  questionId = "#01382", 
  totalQuestions = 0,
  currentDomain = "Any",
  currentSkill = "Any", 
  currentDifficulty = "Any",
  onFiltersChange
}: QuestionBankProps) => {
  // Domain-skill mapping based on explanation.md
  const DOMAIN_SKILL_MAP = {
    "Information and Ideas": [
      "Central Ideas and Details",
      "Command of Evidence", 
      "Inferences"
    ],
    "Craft and Structure": [
      "Words in Context",
      "Text Structure and Purpose",
      "Cross-Text Connections"
    ],
    "Expression of Ideas": [
      "Rhetorical Synthesis",
      "Transitions"
    ],
    "Standard English Conventions": [
      "Boundaries",
      "Form, Structure, and Sense"
    ]
  };

  const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard", "Very Hard"];

  // State for filters
  const [selectedDomain, setSelectedDomain] = useState(currentDomain);
  const [selectedSkill, setSelectedSkill] = useState(currentSkill);
  const [selectedDifficulty, setSelectedDifficulty] = useState(currentDifficulty);

  // Get available skills for selected domain
  const availableSkills = selectedDomain === "Any" ? ["Any"] : (DOMAIN_SKILL_MAP[selectedDomain as keyof typeof DOMAIN_SKILL_MAP] || []);

  // Handle domain change and auto-set first skill
  const handleDomainChange = (domain: string) => {
    setSelectedDomain(domain);
    // Reset skill to "Any" for "Any" domain, or first available skill in new domain
    if (domain === "Any") {
      setSelectedSkill("Any");
    } else {
      const newSkills = DOMAIN_SKILL_MAP[domain as keyof typeof DOMAIN_SKILL_MAP];
      if (newSkills && newSkills.length > 0) {
        setSelectedSkill(newSkills[0]);
      }
    }
  };

  // Auto-trigger filtering when any filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        domain: selectedDomain,
        skill: selectedSkill,
        difficulty: selectedDifficulty
      });
    }
  }, [selectedDomain, selectedSkill, selectedDifficulty, onFiltersChange]);

  const questionInfo = [
    { label: "Question ID", value: questionId.replace("#", "") },
    { label: "Section", value: "Reading and Writing" },
    { label: "Domain", value: currentDomain },
    { label: "Skill", value: currentSkill },
    { label: "Difficulty", value: currentDifficulty },
  ];

  return (
    <div className="mb-6">
      {/* Full Width Filter Controls */}
      <Card className="w-full shadow-sm border border-muted-foreground/10">
        <CardHeader className="pb-2 pt-3">
          <h2 className="text-base font-semibold">Question Filters</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Domain Selection */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Domain</label>
              <Select value={selectedDomain} onValueChange={handleDomainChange}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select Domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any" className="text-sm">Any Domain</SelectItem>
                  {Object.keys(DOMAIN_SKILL_MAP).map((domain) => (
                    <SelectItem key={domain} value={domain} className="text-sm">
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Skill Selection */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Skill</label>
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select Skill" />
                </SelectTrigger>
                <SelectContent>
                  {selectedDomain === "Any" ? (
                    <SelectItem value="Any" className="text-sm">Any Skill</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="Any" className="text-sm">Any Skill</SelectItem>
                      {availableSkills.map((skill) => (
                        <SelectItem key={skill} value={skill} className="text-sm">
                          {skill}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Difficulty Selection */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any" className="text-sm">Any Difficulty</SelectItem>
                  {DIFFICULTY_OPTIONS.map((difficulty) => (
                    <SelectItem key={difficulty} value={difficulty} className="text-sm">
                      {difficulty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};