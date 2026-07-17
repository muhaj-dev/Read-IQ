import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { NextButton } from '@/components/quiz/next-button';
import { QuizFeedback } from '@/components/quiz/quiz-feedback';
import { QuizOption, type OptionStatus } from '@/components/quiz/quiz-option';
import { QuizProgress } from '@/components/quiz/quiz-progress';
import { QuizQuestion } from '@/components/quiz/quiz-question';
import { SourceChip } from '@/components/quiz/source-chip';
import type { AttemptInput } from '@/store/use-quiz-store';
import type { GeneratedQuiz, MissedQuestion } from '@/types/quiz';

type Props = {
  quiz: GeneratedQuiz;
  /** Called once the last question is answered — carries the scored attempt. */
  onFinish: (attempt: AttemptInput) => void;
};

/** Runs a quiz one MCQ per screen with green/red feedback; tracks missed topics. */
export function QuizRunner({ quiz, onFinish }: Props) {
  const { questions } = quiz;

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [missed, setMissed] = useState<MissedQuestion[]>([]);

  const question = questions[index];
  const total = questions.length;
  const answered = selected !== null;
  const isCorrect = selected === question.answerKey;
  const isLast = index === total - 1;

  const statusFor = (key: string): OptionStatus => {
    if (!answered) return 'idle';
    if (key === question.answerKey) return 'correct';
    if (key === selected) return 'wrong';
    return 'idle';
  };

  const onSelect = (key: string) => {
    if (answered) return;
    setSelected(key);
    if (key === question.answerKey) {
      setCorrect((c) => c + 1);
    } else {
      setWeakTopics((t) => (t.includes(question.topic) ? t : [...t, question.topic]));
      setMissed((m) => [...m, { question, selectedKey: key }]);
    }
  };

  const onNext = () => {
    if (isLast) {
      onFinish({
        sourceId: quiz.sourceId,
        sourceLabel: quiz.sourceLabel,
        total,
        correct,
        weakTopics,
        missed,
      });
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
  };

  return (
    <View className="flex-1">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <QuizProgress current={index + 1} total={total} />

        <SourceChip label={quiz.sourceLabel} />

        <QuizQuestion prompt={question.prompt} />

        <View className="gap-3">
          {question.options.map((option) => (
            <QuizOption
              key={option.key}
              letter={option.key}
              text={option.text}
              status={statusFor(option.key)}
              disabled={answered}
              onPress={() => onSelect(option.key)}
            />
          ))}
        </View>

        {answered && <QuizFeedback correct={isCorrect} />}
      </ScrollView>

      <View className="px-5 pb-2 pt-3">
        <NextButton label={isLast ? 'Finish' : 'Next Question'} enabled={answered} onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  },
});
