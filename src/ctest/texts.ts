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
  {
    id: 'b1-ehrenamt',
    level: 'B1',
    title: 'Ehrenamt im Verein',
    text: 'In Deutschland arbeiten viele Menschen in ihrer Freizeit ehrenamtlich. Sie bekommen dafür kein Geld, aber sie helfen anderen und lernen neue Leute kennen. Besonders beliebt sind Sportvereine, in denen Erwachsene zum Beispiel Kinder trainieren oder Turniere organisieren. Andere engagieren sich bei der Feuerwehr, in der Kirche oder in einem Tierheim. Viele Freiwillige sagen, dass ihnen die Arbeit Spaß macht, weil sie etwas Sinnvolles tun. Früher war es für die Vereine leicht, neue Mitglieder zu finden, doch heute suchen viele von ihnen dringend Unterstützung. Junge Leute haben oft wenig Zeit, weil Schule, Studium oder Beruf sie stark belasten. Deshalb bieten einige Organisationen jetzt kurze Projekte an, bei denen man nur ein paar Stunden im Monat mithelfen muss.',
    properNames: ['Deutschland'],
  },
  {
    id: 'b1-umzug',
    level: 'B1',
    title: 'Umzug in eine neue Stadt',
    text: 'Letztes Jahr ist Jonas wegen seiner neuen Arbeit von einem kleinen Dorf nach Hamburg gezogen. Die ersten Wochen waren nicht leicht für ihn, denn er kannte in der Stadt niemanden. Nach der Arbeit saß er oft allein in seiner Wohnung und telefonierte abends lange mit seinen Eltern. Eine Kollegin hat ihm dann geraten, sich einen Sportkurs oder einen Chor zu suchen. Obwohl er zuerst keine große Lust hatte, ist er schließlich zu einer Laufgruppe gegangen, die sich zweimal pro Woche im Park trifft. Dort hat er schnell nette Leute kennengelernt, mit denen er heute auch am Wochenende etwas unternimmt. Außerdem hat er inzwischen ein Lieblingscafé in seiner Straße, wo man ihn schon kennt. Heute fühlt sich Jonas in der großen Stadt richtig wohl und möchte nicht mehr zurück aufs Land.',
    properNames: ['Jonas', 'Hamburg'],
  },
  {
    id: 'b1-schlaf',
    level: 'B1',
    title: 'Gut schlafen',
    text: 'Viele Menschen schlafen schlecht und fühlen sich am Morgen müde. Oft liegt das nicht an einer Krankheit, sondern an unseren Gewohnheiten am Abend. Wer bis spät in die Nacht auf das Handy schaut, kann meistens nicht so schnell einschlafen, weil das helle Licht den Körper nicht zur Ruhe kommen lässt. Auch Kaffee oder ein schweres Essen am Abend können den Schlaf stören. Ärzte raten deshalb, jeden Tag ungefähr zur gleichen Zeit ins Bett zu gehen und morgens zur gleichen Zeit aufzustehen. Das Schlafzimmer sollte ruhig, dunkel und nicht zu warm sein. Meine Schwester hat jahrelang schlecht geschlafen, bis sie angefangen hat, ihr Handy abends in der Küche zu lassen. Seitdem liest sie vor dem Einschlafen ein Buch und ist morgens viel ausgeruhter als früher.',
  },
  {
    id: 'b1-zug',
    level: 'B1',
    title: 'Reisen mit dem Zug',
    text: 'Im letzten Sommer sind wir zum ersten Mal mit dem Zug in den Urlaub gefahren. Früher haben wir immer das Auto genommen, aber die langen Staus auf der Autobahn haben uns jedes Jahr geärgert. Im Zug konnten die Kinder lesen, spielen oder einfach aus dem Fenster schauen, während mein Mann und ich uns endlich einmal entspannt haben. Natürlich war die Reise nicht ganz perfekt, denn ein Zug hatte eine Stunde Verspätung und wir haben fast unseren Anschluss verpasst. Trotzdem waren wir am Ende alle zufrieden, weil die Fahrt viel ruhiger war als mit dem Auto. Die Tickets haben wir schon drei Monate vorher gekauft, deshalb waren sie auch nicht besonders teuer. Ein weiterer Vorteil ist, dass man mit dem Zug weniger Abgase produziert als mit dem Auto. Für den nächsten Urlaub haben wir schon wieder Plätze im Nachtzug reserviert.',
  },
  {
    id: 'b2-homeoffice',
    level: 'B2',
    title: 'Homeoffice und die Zukunft der Innenstädte',
    text: 'Seit sich das Arbeiten von zu Hause aus in vielen Branchen etabliert hat, stehen zahlreiche Innenstädte vor neuen Herausforderungen. Da ein erheblicher Teil der Beschäftigten nur noch an wenigen Tagen ins Büro kommt, werden ganze Bürogebäude kaum noch genutzt. Auch Geschäfte, Cafés und Kantinen in den Zentren leiden unter dem Rückgang der Laufkundschaft, auf die sie jahrelang angewiesen waren. Stadtplaner sehen in dieser Entwicklung allerdings nicht nur eine Gefahr, sondern auch eine Chance. Leer stehende Büroflächen könnten in Wohnungen umgewandelt werden, wodurch zugleich der angespannte Wohnungsmarkt entlastet würde. Ein solcher Umbau ist jedoch mit hohen Kosten und komplizierten Genehmigungsverfahren verbunden. Hinzu kommt, dass viele Eigentümer noch abwarten, ob die Nachfrage nach Büros nicht doch wieder steigt. Wie die Innenstädte in einigen Jahrzehnten aussehen werden, hängt daher maßgeblich von politischen Entscheidungen ab.',
  },
  {
    id: 'b2-fachkraefte',
    level: 'B2',
    title: 'Fachkräftemangel',
    text: 'In vielen Branchen bleiben offene Stellen inzwischen monatelang unbesetzt. Besonders betroffen sind das Handwerk, die Pflege und der Bereich der Informationstechnik, in dem qualifizierte Fachleute seit Langem gesucht werden. Eine wesentliche Ursache des Mangels ist der demografische Wandel, denn in den kommenden Jahren gehen mehr Menschen in den Ruhestand, als junge Arbeitskräfte nachrücken. Um die Lücke zu schließen, setzen Politik und Wirtschaft unter anderem auf die gezielte Anwerbung ausländischer Fachkräfte. Diese stoßen allerdings häufig auf bürokratische Hürden, etwa wenn ihre Abschlüsse erst nach langwierigen Verfahren anerkannt werden. Darüber hinaus wäre es sinnvoll, das Potenzial im eigenen Land besser auszuschöpfen, beispielsweise durch flexible Arbeitszeitmodelle für Eltern. Auch die Weiterbildung älterer Beschäftigter wird von Arbeitsmarktforschern als wichtige Maßnahme genannt. Ob diese Ansätze ausreichen, um den Bedarf langfristig zu decken, ist unter Experten jedoch umstritten.',
  },
  {
    id: 'b2-desinformation',
    level: 'B2',
    title: 'Wissenschaft und Desinformation',
    text: 'In sozialen Netzwerken verbreiten sich falsche Behauptungen über wissenschaftliche Themen oft schneller als sorgfältig geprüfte Informationen. Das liegt unter anderem daran, dass zugespitzte und emotionale Botschaften häufiger geteilt werden als nüchterne Erklärungen. Besonders problematisch ist dies bei Fragen der Gesundheit, weil Fehlinformationen dort unmittelbare Folgen für das Verhalten der Menschen haben können. Viele Forschende würden ihre Ergebnisse gern verständlicher vermitteln, doch dafür fehlt ihnen im Arbeitsalltag häufig die Zeit. Manche von ihnen sind sogar persönlich angegriffen worden, nachdem sie sich öffentlich zu umstrittenen Themen geäußert hatten. Fachleute halten es deshalb für notwendig, die Medienkompetenz bereits in der Schule zu fördern. Wer frühzeitig lernt, Quellen kritisch zu prüfen, lässt sich von unseriösen Beiträgen weniger leicht täuschen. Gleichzeitig tragen auch die Betreiber der Plattformen eine Verantwortung, der sie bislang nur unzureichend nachkommen.',
  },
  {
    id: 'b2-klimaanpassung',
    level: 'B2',
    title: 'Städte im Klimawandel',
    text: 'Durch den Klimawandel nehmen Hitzewellen und Starkregen auch in Mitteleuropa deutlich zu. Besonders in dicht bebauten Städten heizen sich Straßen und Gebäude im Sommer stark auf, während sie nachts kaum abkühlen. Für ältere und kranke Menschen kann diese Belastung lebensgefährlich werden. Viele Kommunen haben deshalb begonnen, ihre Stadtplanung grundlegend zu überdenken. So werden zusätzliche Bäume gepflanzt, Dächer begrünt und versiegelte Flächen wieder entsiegelt, damit das Regenwasser im Boden versickern kann. Nach dem Vorbild sogenannter Schwammstädte soll das Wasser gespeichert und in Trockenperioden zur Bewässerung genutzt werden. Kritiker bemängeln allerdings, dass die Umsetzung solcher Maßnahmen oft zu langsam vorankommt und an fehlenden finanziellen Mitteln scheitert. Würde man konsequenter handeln, ließen sich die Folgekosten künftiger Extremwetterereignisse erheblich verringern.',
    properNames: ['Mitteleuropa'],
  },
]
