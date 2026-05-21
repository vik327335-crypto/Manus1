import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Play,
  CheckCircle,
  Clock,
  Award,
  Zap,
  Target,
} from "lucide-react";

interface Tutorial {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number;
  progress?: number;
  isCompleted?: boolean;
}

interface Quest {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  reward: number;
  badge?: string;
  isCompleted?: boolean;
}

const mockTutorials: Tutorial[] = [
  {
    id: 1,
    title: "Введение в CAN SLIM",
    description: "Изучите основы методологии CAN SLIM Уильяма О'Нила",
    category: "getting-started",
    difficulty: "beginner",
    estimatedTime: 15,
    progress: 100,
    isCompleted: true,
  },
  {
    id: 2,
    title: "Как использовать сканер активов",
    description: "Научитесь находить перспективные криптовалюты",
    category: "scanning",
    difficulty: "beginner",
    estimatedTime: 20,
    progress: 60,
  },
  {
    id: 3,
    title: "Управление портфелем",
    description: "Создавайте и управляйте своим портфелем",
    category: "portfolio",
    difficulty: "intermediate",
    estimatedTime: 25,
    progress: 0,
  },
  {
    id: 4,
    title: "Виртуальная торговля",
    description: "Практикуйтесь в торговле без риска потери средств",
    category: "trading",
    difficulty: "beginner",
    estimatedTime: 30,
    progress: 0,
  },
  {
    id: 5,
    title: "Анализ технических индикаторов",
    description: "Углубленное изучение технических индикаторов",
    category: "scanning",
    difficulty: "advanced",
    estimatedTime: 45,
    progress: 0,
  },
];

const mockQuests: Quest[] = [
  {
    id: 1,
    title: "Первый скан",
    description: "Выполните первый скан активов",
    category: "scanning",
    difficulty: "beginner",
    reward: 100,
    badge: "first-scan",
    isCompleted: true,
  },
  {
    id: 2,
    title: "Создайте портфель",
    description: "Создайте свой первый портфель",
    category: "portfolio",
    difficulty: "beginner",
    reward: 150,
    badge: "portfolio-master",
  },
  {
    id: 3,
    title: "Виртуальный трейдер",
    description: "Заработайте 1000$ в виртуальной торговле",
    category: "trading",
    difficulty: "intermediate",
    reward: 500,
    badge: "paper-trader",
  },
  {
    id: 4,
    title: "Социальный трейдер",
    description: "Скопируйте 10 сделок от других трейдеров",
    category: "social",
    difficulty: "intermediate",
    reward: 300,
    badge: "social-trader",
  },
  {
    id: 5,
    title: "Эксперт CAN SLIM",
    description: "Завершите все туториалы по CAN SLIM",
    category: "learning",
    difficulty: "advanced",
    reward: 1000,
    badge: "can-slim-expert",
  },
];

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "bg-green-100 text-green-800";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800";
    case "advanced":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getDifficultyLabel = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "Начинающий";
    case "intermediate":
      return "Средний";
    case "advanced":
      return "Продвинутый";
    default:
      return difficulty;
  }
};

export default function LearningHub() {
  const [selectedTab, setSelectedTab] = useState("tutorials");

  const completedTutorials = mockTutorials.filter((t) => t.isCompleted).length;
  const completedQuests = mockQuests.filter((q) => q.isCompleted).length;
  const totalPoints = mockQuests
    .filter((q) => q.isCompleted)
    .reduce((sum, q) => sum + q.reward, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Центр обучения</h1>
        <p className="text-gray-600 mt-2">
          Изучайте платформу и зарабатывайте награды
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Завершённые туториалы</p>
                <p className="text-2xl font-bold">
                  {completedTutorials}/{mockTutorials.length}
                </p>
              </div>
              <BookOpen className="text-blue-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Завершённые квесты</p>
                <p className="text-2xl font-bold">
                  {completedQuests}/{mockQuests.length}
                </p>
              </div>
              <Target className="text-green-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Заработано очков</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
              <Zap className="text-yellow-500" size={32} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Достижения</p>
                <p className="text-2xl font-bold">{completedQuests}</p>
              </div>
              <Award className="text-purple-500" size={32} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tutorials">Туториалы</TabsTrigger>
          <TabsTrigger value="quests">Квесты</TabsTrigger>
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
        </TabsList>

        {/* Tutorials Tab */}
        <TabsContent value="tutorials" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {tutorial.description}
                      </p>
                    </div>
                    {tutorial.isCompleted && (
                      <CheckCircle className="text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getDifficultyColor(tutorial.difficulty)}>
                      {getDifficultyLabel(tutorial.difficulty)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock size={16} />
                      {tutorial.estimatedTime} мин
                    </div>
                  </div>

                  {tutorial.progress !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Прогресс</span>
                        <span>{tutorial.progress}%</span>
                      </div>
                      <Progress value={tutorial.progress} />
                    </div>
                  )}

                  {tutorial.isCompleted ? (
                    <Button disabled className="w-full">
                      ✓ Завершено
                    </Button>
                  ) : (
                    <Button className="w-full flex items-center gap-2">
                      <Play size={16} />
                      {tutorial.progress ? "Продолжить" : "Начать"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quests Tab */}
        <TabsContent value="quests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockQuests.map((quest) => (
              <Card
                key={quest.id}
                className={`hover:shadow-lg transition-shadow ${
                  quest.isCompleted ? "opacity-75" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{quest.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {quest.description}
                      </p>
                    </div>
                    {quest.isCompleted && (
                      <CheckCircle className="text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(quest.difficulty)}>
                        {getDifficultyLabel(quest.difficulty)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                      <Zap size={16} />
                      +{quest.reward} очков
                    </div>
                  </div>

                  {quest.isCompleted ? (
                    <Button disabled className="w-full">
                      ✓ Завершено
                    </Button>
                  ) : (
                    <Button className="w-full">Начать квест</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ваши достижения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockQuests
                  .filter((q) => q.isCompleted && q.badge)
                  .map((quest) => (
                    <div
                      key={quest.id}
                      className="flex flex-col items-center text-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg"
                    >
                      <Award className="text-yellow-500 mb-2" size={32} />
                      <p className="font-semibold text-sm">{quest.title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        +{quest.reward} очков
                      </p>
                    </div>
                  ))}
              </div>

              {completedQuests === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Завершите квесты, чтобы получить достижения
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
