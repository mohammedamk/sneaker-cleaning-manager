import Settings from "../component/settings/Settings";
import settingsStyles from "../component/settings/settings.css?url";

export const links = () => [
  { rel: "stylesheet", href: settingsStyles },
];

export default function AppSettingsRoute() {
  return (
    <Settings />
  );
}