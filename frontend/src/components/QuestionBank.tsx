import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DOMAIN_SKILL_MAP, DIFFICULTY_OPTIONS, DEFAULT_FILTER_VALUE } from "../constants";
import { FilterOptions } from "../types";

interface QuestionBankProps {
  questionId?: string;
  currentDomain?: string;
  currentSkill?: string;
  currentDifficulty?: string;
  onFiltersChange?: (filters: FilterOptions) => void;
}

export const QuestionBank = ({ 
  questionId = "#01382", 
  currentDomain = DEFAULT_FILTER_VALUE,
  currentSkill = DEFAULT_FILTER_VALUE, 
  currentDifficulty = DEFAULT_FILTER_VALUE,
  onFiltersChange
}: QuestionBankProps) => {
  // State for filters
  const [selectedDomain, setSelectedDomain] = useState(currentDomain);
  const [selectedSkill, setSelectedSkill] = useState(currentSkill);
  const [selectedDifficulty, setSelectedDifficulty] = useState(currentDifficulty);
  const isInitialMount = useRef(true);

  // Get available skills for selected domain
  const getAvailableSkills = () => {
    if (selectedDomain === DEFAULT_FILTER_VALUE) return [DEFAULT_FILTER_VALUE];
    return DOMAIN_SKILL_MAP[selectedDomain as keyof typeof DOMAIN_SKILL_MAP] || [];
  };

  // Handle domain change and auto-set first skill
  const handleDomainChange = (domain: string) => {
    setSelectedDomain(domain);
    
    if (domain === DEFAULT_FILTER_VALUE) {
      setSelectedSkill(DEFAULT_FILTER_VALUE);
    } else {
      const availableSkills = DOMAIN_SKILL_MAP[domain as keyof typeof DOMAIN_SKILL_MAP];
      if (availableSkills && availableSkills.length > 0) {
        setSelectedSkill(availableSkills[0]);
      }
    }
  };

  // Auto-trigger filtering when any filter changes (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (onFiltersChange) {
      onFiltersChange({
        domain: selectedDomain,
        skill: selectedSkill,
        difficulty: selectedDifficulty
      });
    }
  }, [selectedDomain, selectedSkill, selectedDifficulty]);

  const availableSkills = getAvailableSkills();

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
                  <SelectItem value={DEFAULT_FILTER_VALUE} className="text-sm">Any Domain</SelectItem>
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
                  {selectedDomain === DEFAULT_FILTER_VALUE ? (
                    <SelectItem value={DEFAULT_FILTER_VALUE} className="text-sm">Select Domain first</SelectItem>
                  ) : (
                    <>
                      <SelectItem value={DEFAULT_FILTER_VALUE} className="text-sm">Any Skill</SelectItem>
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
                  <SelectItem value={DEFAULT_FILTER_VALUE} className="text-sm">Any Difficulty</SelectItem>
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