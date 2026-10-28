export type CTestLevel = 'B1' | 'B2' | 'B2+'

export type CTestText = {
  id: string
  level: CTestLevel
  title: string
  text: string
  properNames?: string[]
  focus?: string
}

export const BUILTIN_TEXTS: CTestText[] = [
  {
    id: 'b1-wohnen',
    level: 'B1',
    title: 'Wohnen in der Stadt',
    text: 'Immer mehr Menschen ziehen in die großen Städte. Dort finden sie oft bessere Arbeitsplätze und mehr Freizeitangebote als auf dem Land. Allerdings ist es in vielen Städten sehr schwierig, eine günstige Wohnung zu finden. Die Mieten sind in den letzten Jahren stark gestiegen, weil die Nachfrage viel größer ist als das Angebot. Viele junge Leute wohnen deshalb in einer Wohngemeinschaft, in der sie sich die Küche und das Bad teilen. Das spart Geld, und man ist nicht allein. Manche Familien entscheiden sich aber auch bewusst für ein Leben auf dem Land, wo es ruhiger ist und die Kinder mehr Platz zum Spielen haben.',
  },
  {
    id: 'b1-praktikum',
    level: 'B1',
    title: 'Ein Praktikum im Ausland',
    text: 'Nach dem Abitur wusste Lena nicht genau, was sie studieren wollte. Deshalb entschied sie sich, zuerst ein Praktikum im Ausland zu machen. Sie fand eine Stelle bei einer kleinen Firma in Spanien, die Möbel aus Holz herstellt. Am Anfang war alles neu und ein bisschen schwierig, denn sie sprach nur wenig Spanisch. Ihre Kollegen waren aber sehr freundlich und haben ihr bei vielen Dingen geholfen. Nach ein paar Wochen konnte sie schon kleine Gespräche führen und verstand fast alles. Sie lernte nicht nur die Sprache, sondern auch, selbstständig zu arbeiten und Probleme allein zu lösen. Heute sagt sie, dass diese Zeit die wichtigste Erfahrung ihres Lebens war.',
    properNames: ['Lena', 'Spanien'],
  },
  {
    id: 'b1-essen',
    level: 'B1',
    title: 'Gesund essen',
    text: 'Viele Menschen wissen, dass gesunde Ernährung wichtig ist. Trotzdem essen sie im Alltag oft zu schnell und zu viel. Wer den ganzen Tag arbeitet, hat am Abend meistens keine Lust mehr zu kochen. Dann bestellt man eine Pizza oder kauft ein Fertiggericht im Supermarkt. Ärzte empfehlen, jeden Tag Obst und Gemüse zu essen und viel Wasser zu trinken. Außerdem sollte man nicht zu viel Zucker und Salz zu sich nehmen. Es hilft auch, wenn man feste Zeiten für die Mahlzeiten hat und sich dafür genug Zeit nimmt. Wer einmal pro Woche für mehrere Tage vorkocht, spart nicht nur Zeit, sondern auch Geld.',
  },
  {
    id: 'b1-fahrrad',
    level: 'B1',
    title: 'Das Fahrrad als Verkehrsmittel',
    text: 'In vielen deutschen Städten fahren immer mehr Menschen mit dem Fahrrad zur Arbeit. Das hat mehrere Gründe. Zum einen ist das Fahrrad billiger als ein Auto, und man muss keinen Parkplatz suchen. Zum anderen ist Radfahren gut für die Gesundheit, weil man sich jeden Tag bewegt. Viele Städte bauen deshalb neue Radwege und verbessern die Sicherheit an gefährlichen Kreuzungen. Trotzdem gibt es noch Probleme: Bei Regen oder Schnee bleiben viele Leute lieber zu Hause oder nehmen den Bus. Außerdem fehlen an manchen Bahnhöfen sichere Abstellplätze für Fahrräder. Experten glauben aber, dass der Radverkehr in den nächsten Jahren weiter wachsen wird.',
  },
  {
    id: 'b2-ki-schule',
    level: 'B2',
    title: 'Künstliche Intelligenz in der Schule',
    text: 'Seit einigen Jahren wird intensiv darüber diskutiert, welche Rolle künstliche Intelligenz im Unterricht spielen sollte. Befürworter betonen, dass digitale Programme Schülerinnen und Schüler individuell fördern können, indem sie Aufgaben an das jeweilige Niveau anpassen. Kritiker hingegen befürchten, dass die Jugendlichen das selbstständige Denken verlernen, wenn ihnen eine Maschine jede Antwort liefert. Außerdem sei bislang nicht ausreichend erforscht, wie sich die ständige Nutzung solcher Systeme langfristig auf die Konzentration auswirkt. Viele Lehrkräfte stehen der Entwicklung daher mit gemischten Gefühlen gegenüber. Einig sind sich die meisten Fachleute jedoch darin, dass ein generelles Verbot kaum durchsetzbar wäre. Entscheidend sei vielmehr, den kritischen Umgang mit den neuen Werkzeugen gezielt zu vermitteln.',
  },
  {
    id: 'b2-arbeitszeit',
    level: 'B2',
    title: 'Weniger arbeiten, gleich viel leisten?',
    text: 'In zahlreichen Unternehmen wird derzeit ein Arbeitsmodell getestet, das noch vor wenigen Jahren als unrealistisch gegolten hätte. Die Beschäftigten arbeiten nur noch an vier Tagen pro Woche, erhalten aber weiterhin ihr volles Gehalt. Erste Untersuchungen deuten darauf hin, dass die Produktivität dabei nicht sinkt, sondern in manchen Fällen sogar steigt. Die Mitarbeitenden fühlen sich erholter, sind seltener krank und können sich besser auf ihre Aufgaben konzentrieren. Allerdings lässt sich das Modell nicht ohne Weiteres auf alle Branchen übertragen. In der Pflege oder im Einzelhandel etwa müssten zusätzliche Kräfte eingestellt werden, um die Arbeitszeit zu verkürzen, ohne den Betrieb einzuschränken. Ob sich die verkürzte Woche flächendeckend durchsetzen wird, bleibt daher abzuwarten.',
  },
  {
    id: 'b2-lebensmittel',
    level: 'B2',
    title: 'Lebensmittelverschwendung',
    text: 'Jedes Jahr landen in Deutschland Millionen Tonnen genießbarer Lebensmittel im Müll. Ein Großteil davon wird nicht etwa von Supermärkten oder Restaurants weggeworfen, sondern von privaten Haushalten. Häufig kaufen Verbraucher mehr ein, als sie tatsächlich benötigen, oder sie lagern die Produkte falsch, sodass diese schneller verderben. Hinzu kommt, dass viele das Mindesthaltbarkeitsdatum mit einem Verfallsdatum verwechseln. Dabei sind die meisten Lebensmittel auch nach Ablauf dieses Datums noch problemlos essbar, sofern sie richtig gelagert wurden. Verschiedene Initiativen versuchen, überschüssige Waren an Menschen weiterzugeben, die sie noch verwenden können. Experten fordern darüber hinaus, das Thema stärker im Schulunterricht zu behandeln.',
  },
  {
    id: 'b2-mehrsprachigkeit',
    level: 'B2',
    title: 'Mehrsprachig aufwachsen',
    text: 'Lange Zeit glaubte man, dass Kinder durch das gleichzeitige Erlernen mehrerer Sprachen überfordert würden. Inzwischen hat die Forschung diese Annahme weitgehend widerlegt. Zahlreiche Studien zeigen, dass mehrsprachig aufwachsende Kinder zwar anfangs manchmal Wörter aus verschiedenen Sprachen mischen, dies jedoch eine normale Phase der Entwicklung darstellt. Langfristig profitieren sie sogar von ihrer Mehrsprachigkeit, da sie flexibler denken und sich leichter auf neue Situationen einstellen können. Entscheidend ist allerdings, dass die Kinder in allen Sprachen ausreichend Kontakt mit kompetenten Sprechern haben. Eltern wird daher empfohlen, mit ihren Kindern konsequent in der Sprache zu sprechen, die sie selbst am besten beherrschen. So erhalten die Kinder ein sprachliches Vorbild, an dem sie sich orientieren können.',
  },
]
