"use client";

import * as React from "react";
import { useTeamStore } from "@/store/use-team-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  ZBI_QUESTIONS,
  ZBI_SCORE_OPTIONS,
  calculateBurdenLevel,
  getBurdenLevelLabel,
  getBurdenLevelColor,
} from "@/lib/zbi-questions";
import { CheckCircle2, TrendingUp, ArrowRight, ArrowLeft } from "lucide-react";
import { PermissionGuard } from "@/components/permission-guard";

export default function CaregiverBurdenPage() {
  const { activeTeam } = useTeamStore();
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [responses, setResponses] = React.useState<Record<string, number>>({});
  const [previousScales, setPreviousScales] = React.useState<any[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const [currentScore, setCurrentScore] = React.useState<number | null>(null);
  const [currentLevel, setCurrentLevel] = React.useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);

  React.useEffect(() => {
    if (activeTeam) {
      fetchPreviousScales();
    }
  }, [activeTeam]);

  const fetchPreviousScales = async () => {
    if (!activeTeam) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/caregiver-burden`,
      );
      if (response.ok) {
        const data = await response.json();
        setPreviousScales(data.scales || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching previous scales:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = () => {
    const totalScore = Object.values(responses).reduce(
      (sum, score) => sum + score,
      0,
    );
    return totalScore;
  };

  const handleSubmit = async () => {
    if (!activeTeam) return;

    const totalScore = calculateScore();
    if (Object.keys(responses).length < ZBI_QUESTIONS.length) {
      toast.error("Please answer all questions");
      return;
    }

    setSubmitting(true);
    try {
      const burdenLevel = calculateBurdenLevel(totalScore);
      const response = await fetch(
        `/api/teams/${activeTeam.id}/caregiver-burden`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            responses,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit questionnaire");
      }

      const data = await response.json();
      setCurrentScore(totalScore);
      setCurrentLevel(burdenLevel);
      setShowResults(true);
      toast.success("Assessment saved successfully");
      fetchPreviousScales();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit questionnaire",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < ZBI_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Last question - submit
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleResponseChange = (questionId: string, value: number) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const allQuestionsAnswered =
    Object.keys(responses).length === ZBI_QUESTIONS.length;
  const currentQuestion = ZBI_QUESTIONS[currentQuestionIndex];
  const progress = (Object.keys(responses).length / ZBI_QUESTIONS.length) * 100;
  const currentResponse = responses[currentQuestion.id];

  return (
    <PermissionGuard permission="canViewBurdenScales">
      <div className="flex flex-col h-full">
        <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <div className="flex h-14 items-center justify-between px-6">
            <div>
              <h1 className="text-lg font-semibold">
                Caregiver Burden Assessment
              </h1>
              <p className="text-sm text-muted-foreground">22 Questions</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Progress Indicator */}
            {!showResults && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Question {currentQuestionIndex + 1} of{" "}
                        {ZBI_QUESTIONS.length}
                      </span>
                      <span className="font-medium">
                        {Object.keys(responses).length} answered
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {showResults && currentScore !== null && currentLevel && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Assessment Complete
                  </CardTitle>
                  <CardDescription>
                    Your caregiver burden assessment has been saved.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Score
                      </p>
                      <p className="text-3xl font-bold">{currentScore} / 88</p>
                    </div>
                    <Badge
                      className={`text-sm px-3 py-1 ${getBurdenLevelColor(currentLevel)}`}
                      variant="outline"
                    >
                      {getBurdenLevelLabel(currentLevel)}
                    </Badge>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      Interpretation:
                    </p>
                    <p className="text-sm">
                      {currentLevel === "LOW" &&
                        "You are experiencing little or no burden. Continue to monitor your well-being."}
                      {currentLevel === "MILD_MODERATE" &&
                        "You are experiencing mild to moderate burden. Consider seeking support and taking breaks when needed."}
                      {currentLevel === "MODERATE_SEVERE" &&
                        "You are experiencing moderate to severe burden. It's important to seek support from healthcare providers, family, or support groups."}
                      {currentLevel === "SEVERE" &&
                        "You are experiencing severe burden. Please consider reaching out to healthcare providers, counselors, or support services for assistance."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowResults(false);
                      setResponses({});
                      setCurrentQuestionIndex(0);
                      setCurrentScore(null);
                      setCurrentLevel(null);
                    }}
                  >
                    Take New Assessment
                  </Button>
                </CardContent>
              </Card>
            )}

            {!showResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">
                    Caregiver Burden Assessment
                  </CardTitle>
                  <CardDescription>
                    This assessment helps track your well-being as a caregiver.
                    Each submission is saved as a new record so you can track
                    changes over time.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Current Question */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-lg font-semibold">
                        {currentQuestion.number}. {currentQuestion.text}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        How often do you feel this way?
                      </p>
                    </div>

                    <RadioGroup
                      value={currentResponse?.toString() || ""}
                      onValueChange={(value) =>
                        handleResponseChange(
                          currentQuestion.id,
                          parseInt(value),
                        )
                      }
                      className="space-y-3"
                    >
                      {ZBI_SCORE_OPTIONS.map((option) => (
                        <div
                          key={option.value}
                          className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            currentResponse === option.value
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          }`}
                          onClick={() =>
                            handleResponseChange(
                              currentQuestion.id,
                              option.value,
                            )
                          }
                        >
                          <RadioGroupItem
                            value={option.value.toString()}
                            id={`${currentQuestion.id}-${option.value}`}
                          />
                          <Label
                            htmlFor={`${currentQuestion.id}-${option.value}`}
                            className="text-base font-normal cursor-pointer flex-1"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      {currentQuestionIndex + 1} / {ZBI_QUESTIONS.length}
                    </div>

                    {currentQuestionIndex === ZBI_QUESTIONS.length - 1 ? (
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!currentResponse || submitting}
                        size="lg"
                      >
                        {submitting ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Saving...
                          </>
                        ) : (
                          <>
                            Complete Assessment
                            <CheckCircle2 className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!currentResponse}
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Previous Assessments - Show history to track progress */}
            {previousScales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Assessment History
                  </CardTitle>
                  <CardDescription>
                    Each assessment is saved as a new record. Track your
                    progress over time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previousScales.map((scale, index) => {
                      const previousScale = previousScales[index + 1];
                      const scoreChange = previousScale
                        ? scale.totalScore - previousScale.totalScore
                        : null;
                      return (
                        <div
                          key={scale.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <p className="text-sm font-medium">
                                {new Date(scale.createdAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                              {scoreChange !== null && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    scoreChange < 0
                                      ? "text-green-600 border-green-600"
                                      : scoreChange > 0
                                        ? "text-red-600 border-red-600"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  {scoreChange > 0 ? "+" : ""}
                                  {scoreChange} from previous
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Score: {scale.totalScore} / 88
                            </p>
                          </div>
                          <Badge
                            className={getBurdenLevelColor(scale.burdenLevel)}
                            variant="outline"
                          >
                            {getBurdenLevelLabel(scale.burdenLevel)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
