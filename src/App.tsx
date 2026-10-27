import { useReducer } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { initialState, reducer } from './state/reducer';
import Intro from './components/Intro';
import Field from './components/Field';
import Ending from './components/Ending';

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        {state.phase === 'intro' && <Intro key="intro" onStart={() => dispatch({ type: 'start' })} />}
        {state.phase === 'field' && <Field key="field" state={state} dispatch={dispatch} />}
        {state.phase === 'ending' && (
          <Ending key="ending" deletions={state.deletions} hesitations={state.hesitations} onRestart={() => dispatch({ type: 'restart' })} />
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
