const positiveAdjectives = ['amazing', 'fantastic', 'excellent', 'outstanding', 'brilliant', 'superb', 'wonderful', 'incredible', 'impressive', 'great'];
const neutralAdjectives = ['decent', 'okay', 'average', 'acceptable', 'reasonable', 'fair', 'moderate', 'standard', 'typical', 'ordinary'];
const criticalAdjectives = ['disappointing', 'frustrating', 'lacking', 'underwhelming', 'problematic', 'buggy', 'slow', 'confusing', 'limited', 'poor'];

const performancePhrases = {
  positive: ['runs smoothly', 'loads instantly', 'performs flawlessly', 'is lightning fast', 'has zero lag'],
  neutral: ['runs adequately', 'loads in reasonable time', 'performs as expected', 'has occasional slowdowns', 'works most of the time'],
  critical: ['runs slowly', 'takes forever to load', 'crashes frequently', 'has serious lag issues', 'drains battery quickly'],
};

const uiPhrases = {
  positive: ['has a beautiful interface', 'is incredibly intuitive', 'has stunning visuals', 'is easy to navigate', 'has a clean modern design'],
  neutral: ['has a functional interface', 'is somewhat easy to use', 'has an acceptable design', 'is navigable', 'has a basic layout'],
  critical: ['has a confusing interface', 'is hard to navigate', 'has an outdated design', 'is cluttered', 'needs a UI overhaul'],
};

const featuresPhrases = {
  positive: ['packed with useful features', 'has everything I need', 'offers great functionality', 'constantly adds new features', 'exceeds expectations'],
  neutral: ['has the basic features', 'covers the essentials', 'has some useful tools', 'meets minimum requirements', 'has limited but functional features'],
  critical: ['is missing key features', 'lacks basic functionality', 'needs more options', 'has very limited features', 'is behind competitors'],
};

const supportPhrases = {
  positive: ['has excellent customer support', 'responds quickly to issues', 'has a helpful team', 'resolves problems fast', 'has great documentation'],
  neutral: ['has average support', 'responds eventually', 'has basic help resources', 'support is hit or miss', 'has some documentation'],
  critical: ['has poor customer support', 'never responds to issues', 'has unhelpful support', 'ignores user feedback', 'has no useful documentation'],
};

const shortSuffixes = ['.', '!', ' - highly recommend.', ' - worth trying.'];
const mediumSuffixes = [' Overall, a solid choice.', ' Would recommend to others.', ' Definitely worth your time.', ' Give it a try!'];
const longSuffixes = [
  ' I\'ve been using it for months and it continues to impress me. Highly recommended for anyone looking for a reliable solution.',
  ' After extensive use, I can confidently say this is one of the better options available. The team clearly puts effort into quality.',
  ' I\'ve tried many alternatives and this stands out. The attention to detail is evident and the experience is consistently good.',
];

type Tone = 'positive' | 'neutral' | 'critical';
type Category = 'performance' | 'ui' | 'features' | 'support';
type Length = 'short' | 'medium' | 'long';

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPhrases(category: Category, tone: Tone): string[] {
  switch (category) {
    case 'performance': return performancePhrases[tone];
    case 'ui': return uiPhrases[tone];
    case 'features': return featuresPhrases[tone];
    case 'support': return supportPhrases[tone];
  }
}

function getAdjectives(tone: Tone): string[] {
  switch (tone) {
    case 'positive': return positiveAdjectives;
    case 'neutral': return neutralAdjectives;
    case 'critical': return criticalAdjectives;
  }
}

function getSuffixes(length: Length): string[] {
  switch (length) {
    case 'short': return shortSuffixes;
    case 'medium': return mediumSuffixes;
    case 'long': return longSuffixes;
  }
}

export function generateTemplates(tone: Tone, category: Category, length: Length, count = 6): string[] {
  const results: string[] = [];
  const phrases = getPhrases(category, tone);
  const adjectives = getAdjectives(tone);
  const suffixes = getSuffixes(length);

  const starters = tone === 'positive'
    ? ['This app is', 'I love how this app', 'This application', 'Absolutely love that this app', 'This tool is']
    : tone === 'neutral'
    ? ['This app', 'The application', 'This tool', 'The software', 'This product']
    : ['This app', 'Unfortunately, this app', 'The application', 'Sadly, this tool', 'This product'];

  for (let i = 0; i < count; i++) {
    const starter = getRandom(starters);
    const adj = getRandom(adjectives);
    const phrase = getRandom(phrases);
    const suffix = getRandom(suffixes);

    let template = '';
    if (tone === 'positive') {
      template = `${starter} ${phrase}${suffix}`;
    } else if (tone === 'neutral') {
      template = `${starter} ${phrase}. It's ${adj} but gets the job done${suffix}`;
    } else {
      template = `${starter} ${phrase}. It's ${adj} and needs improvement${suffix}`;
    }

    results.push(template);
  }

  return [...new Set(results)];
}
