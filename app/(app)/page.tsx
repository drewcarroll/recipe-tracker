import { CookExperience } from '../_components/cook/CookExperience';

/**
 * Cook tab — the default landing route (`/`). Hosts the guided cook flow
 * (idea.md §3): the big COOK button → pick a recipe → ingredients check → guided
 * prep → steps one-by-one → Congrats, with the elapsed cook time captured.
 */
export default function CookPage(): JSX.Element {
  return <CookExperience />;
}
