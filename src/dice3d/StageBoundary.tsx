import { Component, type ReactNode } from 'react';

/** If the 3D stage fails (e.g. Skia can't load), finish the roll so it still shows in the toast. */
export class StageBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Dice stage failed; showing the roll without 3D dice.', error.message);
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
