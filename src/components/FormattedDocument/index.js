import {Linking} from 'react-native';
import {
    DocumentBrand,
    DocumentBulletList,
    DocumentBulletMarker,
    DocumentBulletRow,
    DocumentBulletText,
    DocumentContainer,
    DocumentLink,
    DocumentParagraph,
    DocumentSectionTitle,
} from './styles';

function renderLinks(text) {
    return text.split(/(@[\w.-]+)/g).map((part, index) => {
        if (!part.startsWith('@')) return part;

        const username = part.slice(1);
        return (<DocumentLink key={`link-${index}`}
                              accessibilityRole="link"
                              onPress={() => Linking.openURL(`https://github.com/${username}`).catch(() => {
                              })}>
            {part}
        </DocumentLink>);
    });
}

export default function FormattedDocument({content}) {
    const blocks = content.trim().split(/\n\s*\n/).filter(Boolean);

    return (<DocumentContainer>
        {blocks.map((block, blockIndex) => {
            const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
            const markdownHeading = lines.length === 1 ? lines[0].match(/^\*\*(.+)\*\*$/) : null;
            const numberedHeading = lines.length === 1 && /^\d+\.\s/.test(lines[0]);

            if (markdownHeading || numberedHeading) {
                const heading = markdownHeading ? markdownHeading[1] : lines[0];
                return <DocumentSectionTitle key={`heading-${blockIndex}`}>{heading}</DocumentSectionTitle>;
            }

            if (lines.every((line) => line.startsWith('- '))) {
                return (<DocumentBulletList key={`list-${blockIndex}`}>
                    {lines.map((line, lineIndex) => (<DocumentBulletRow key={`bullet-${lineIndex}`}>
                        <DocumentBulletMarker>-</DocumentBulletMarker>
                        <DocumentBulletText>{renderLinks(line.slice(2))}</DocumentBulletText>
                    </DocumentBulletRow>))}
                </DocumentBulletList>);
            }

            const paragraph = lines.join(' ');
            if (blockIndex === 0 && paragraph === 'FaltaOquê?') {
                return <DocumentBrand key="document-brand">{paragraph}</DocumentBrand>;
            }
            return <DocumentParagraph key={`paragraph-${blockIndex}`}>{renderLinks(paragraph)}</DocumentParagraph>;
        })}
    </DocumentContainer>);
}
