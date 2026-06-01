/**
 * Parseur Markdown léger compatible Metro/Expo Go.
 * Supporte : **gras**, *italique*, `code`, ## titres, - listes, > citations
 */
import { Text, View, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../constants/config';

// Parse une ligne et retourne des segments { text, bold, italic, code }
function parseInline(line) {
  const segments = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) segments.push({ text: line.slice(last, match.index), type: 'normal' });
    const raw = match[0];
    if (raw.startsWith('`'))        segments.push({ text: raw.slice(1, -1), type: 'code' });
    else if (raw.startsWith('**'))  segments.push({ text: raw.slice(2, -2), type: 'bold' });
    else                            segments.push({ text: raw.slice(1, -1), type: 'italic' });
    last = match.index + raw.length;
  }
  if (last < line.length) segments.push({ text: line.slice(last), type: 'normal' });
  return segments;
}

function InlineText({ segments, baseStyle }) {
  return (
    <Text style={baseStyle}>
      {segments.map((seg, i) => {
        if (seg.type === 'bold')   return <Text key={i} style={styles.bold}>{seg.text}</Text>;
        if (seg.type === 'italic') return <Text key={i} style={styles.italic}>{seg.text}</Text>;
        if (seg.type === 'code')   return <Text key={i} style={styles.inlineCode}>{seg.text}</Text>;
        return <Text key={i}>{seg.text}</Text>;
      })}
    </Text>
  );
}

export default function MarkdownText({ children, color }) {
  if (!children) return null;
  const textColor = color ?? COLORS.cream;
  const lines = String(children).split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Ligne vide
    if (line.trim() === '') { elements.push(<View key={`sp${i}`} style={{ height: 6 }} />); i++; continue; }

    // Titres ## ou ###
    if (line.startsWith('### ')) {
      elements.push(<Text key={i} style={[styles.h3, { color: textColor }]}>{line.slice(4)}</Text>);
      i++; continue;
    }
    if (line.startsWith('## ') || line.startsWith('# ')) {
      const text = line.replace(/^#{1,2} /, '');
      elements.push(<Text key={i} style={[styles.h2, { color: COLORS.gold }]}>{text}</Text>);
      i++; continue;
    }

    // Séparateur ---
    if (/^---+$/.test(line.trim())) {
      elements.push(<View key={i} style={styles.hr} />);
      i++; continue;
    }

    // Citation >
    if (line.startsWith('> ')) {
      elements.push(
        <View key={i} style={styles.blockquote}>
          <InlineText segments={parseInline(line.slice(2))} baseStyle={[styles.body, { color: textColor }]} />
        </View>
      );
      i++; continue;
    }

    // Liste - ou *
    if (/^[\-\*] /.test(line)) {
      elements.push(
        <View key={i} style={styles.listItem}>
          <Text style={[styles.bullet, { color: COLORS.gold }]}>•</Text>
          <InlineText segments={parseInline(line.slice(2))} baseStyle={[styles.body, { color: textColor, flex: 1 }]} />
        </View>
      );
      i++; continue;
    }

    // Liste numérotée 1. 2. etc.
    if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)[1];
      elements.push(
        <View key={i} style={styles.listItem}>
          <Text style={[styles.bullet, { color: COLORS.gold }]}>{num}.</Text>
          <InlineText segments={parseInline(line.replace(/^\d+\. /, ''))} baseStyle={[styles.body, { color: textColor, flex: 1 }]} />
        </View>
      );
      i++; continue;
    }

    // Paragraphe normal
    elements.push(
      <InlineText key={i} segments={parseInline(line)} baseStyle={[styles.body, { color: textColor }]} />
    );
    i++;
  }

  return <View>{elements}</View>;
}

const styles = StyleSheet.create({
  body:        { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, marginBottom: 2 },
  bold:        { fontFamily: FONTS.uiBold, color: COLORS.parchment },
  italic:      { fontStyle: 'italic' },
  inlineCode:  { fontFamily: FONTS.uiMedium, backgroundColor: 'rgba(184,137,58,0.2)', color: COLORS.gold, borderRadius: 3, paddingHorizontal: 4, fontSize: 13 },
  h2:          { fontFamily: FONTS.uiBold, fontSize: 15, marginTop: 8, marginBottom: 4 },
  h3:          { fontFamily: FONTS.uiBold, fontSize: 14, color: COLORS.parchment, marginTop: 6, marginBottom: 3 },
  hr:          { height: 1, backgroundColor: 'rgba(126,102,58,0.3)', marginVertical: 8 },
  blockquote:  { borderLeftWidth: 3, borderLeftColor: COLORS.gold, paddingLeft: 10, marginVertical: 4, backgroundColor: 'rgba(245,239,227,0.04)', borderRadius: 2 },
  listItem:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3, gap: 6 },
  bullet:      { fontFamily: FONTS.uiBold, fontSize: 14, lineHeight: 22, minWidth: 14 },
});
