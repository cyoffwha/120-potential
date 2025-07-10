import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PassageText {
  title: string;
  content: string;
}

interface ReadingPassageProps {
  passages?: PassageText[];
}

export const ReadingPassage = ({ passages }: ReadingPassageProps) => {
  const defaultPassages: PassageText[] = [
    {
      title: "Text 1",
      content: `In 1916, H. Dugdale Sykes disputed claims that The Two Noble Kinsmen was coauthored by William Shakespeare and John Fletcher. Sykes felt Fletcher's contributions to the play were obvious—Fletcher had a distinct style in his other plays, so much so that lines with that style were considered sufficient evidence of Fletcher's authorship. But for the lines not deemed to be by Fletcher, Sykes felt that their depiction of women indicated that their author was not Shakespeare but Philip Massinger.`
    },
    {
      title: "Text 2", 
      content: `Scholars have accepted The Two Noble Kinsmen as coauthored by Shakespeare since the 1970s: it appears in all major one-volume editions of Shakespeare's complete works. Though scholars disagree about who wrote what exactly, it is generally held that on the basis of style, Shakespeare wrote all of the first act and most of the last, while John Fletcher authored most of the three middle acts.`
    }
  ];

  const textsToRender = passages || defaultPassages;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Passage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {textsToRender.map((passage, index) => (
          <div key={index} className="space-y-3">
            {/* Only show passage title if there are multiple passages */}
            {textsToRender.length > 1 && (
              <h3 className="font-semibold text-primary">{passage.title}</h3>
            )}
            <p className="text-sm leading-relaxed text-foreground">
              {passage.content}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};