import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

interface TutorialStep {
  id: number;
  stepNumber: number;
  title: string;
  description: string;
  action?: string;
  targetElement?: string;
  highlightArea?: string;
  tips?: string;
}

interface TutorialOverlayProps {
  isOpen: boolean;
  steps: TutorialStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onClose: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  isOpen,
  steps,
  currentStep,
  onNext,
  onPrevious,
  onComplete,
  onClose,
}) => {
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (step?.targetElement) {
      const element = document.querySelector(step.targetElement) as HTMLElement;
      if (element) {
        setHighlightElement(element);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [step]);

  if (!isOpen || !step) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Highlight Box */}
      {highlightElement && (
        <div
          className="fixed border-2 border-blue-500 rounded-lg pointer-events-none z-40 shadow-lg"
          style={{
            top: `${highlightElement.offsetTop - 8}px`,
            left: `${highlightElement.offsetLeft - 8}px`,
            width: `${highlightElement.offsetWidth + 16}px`,
            height: `${highlightElement.offsetHeight + 16}px`,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
          }}
        />
      )}

      {/* Tutorial Card */}
      <Card className="fixed bottom-8 right-8 w-96 z-50 shadow-2xl">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-gray-500">
                Шаг {currentStep + 1} из {steps.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>

          {/* Description */}
          <p className="text-gray-700">{step.description}</p>

          {/* Tips */}
          {step.tips && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <p className="text-sm text-blue-900">
                <strong>💡 Совет:</strong> {step.tips}
              </p>
            </div>
          )}

          {/* Action */}
          {step.action && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
              <p className="text-sm text-amber-900">
                <strong>👉 Действие:</strong> {step.action}
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-2 justify-between pt-4">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirstStep}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Назад
            </Button>

            {isLastStep ? (
              <Button onClick={onComplete} className="flex-1">
                Завершить туториал
              </Button>
            ) : (
              <Button onClick={onNext} className="flex items-center gap-1">
                Далее
                <ChevronRight size={16} />
              </Button>
            )}
          </div>

          {/* Skip Option */}
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 w-full text-center"
          >
            Пропустить туториал
          </button>
        </div>
      </Card>
    </>
  );
};
