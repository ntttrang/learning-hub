import { docUrl } from '../../content/docs';
import { parseInline } from '../../utils/inline';

/**
 * Render the three inline constructs (code, bold, doc links) inside one
 * string of prose. Doc links open in a new tab and title themselves with the
 * registry entry so a hover says where you're going.
 */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((token, index) => {
        switch (token.kind) {
          case 'code':
            return <code key={index}>{token.text}</code>;
          case 'bold':
            return <strong key={index}>{token.text}</strong>;
          case 'link': {
            const url = docUrl(token.docId);
            if (!url) {
              // Unknown docId should be impossible — content tests fail the
              // build first. Degrade to plain label rather than a dead link.
              return <span key={index}>{token.text}</span>;
            }
            return (
              <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                {token.text}
              </a>
            );
          }
          default:
            return <span key={index}>{token.text}</span>;
        }
      })}
    </>
  );
}
