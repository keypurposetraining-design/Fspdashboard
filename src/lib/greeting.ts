/**
 * Time-based greeting utility
 * Returns a greeting based on the user's local time
 */

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening";
  } else {
    return "Good Night";
  }
}

export function getTimeBasedGreetingWithEmoji(name: string): string {
  const greeting = getTimeBasedGreeting();
  const emoji = greeting === "Good Morning" ? "🌅" :
                greeting === "Good Afternoon" ? "☀️" :
                greeting === "Good Evening" ? "🌆" : "🌙";
  return `${greeting}, ${name} ${emoji}`;
}