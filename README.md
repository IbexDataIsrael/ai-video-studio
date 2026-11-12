# AI Video Editing Studio

**Your own AI video editing studio. Free. Open source. Powered by Claude Code or Codex.**

Give it your raw footage (bad takes and all), and work with AI to create polished videos.

Clean cuts. Captions. B-roll. Motion graphics. Sound effects. The works.

But here's where it gets really cool.

Review visual storyboards before the full edit. Give feedback at specific timestamps. Save previous videos and borrow editing techniques inspired by your favorite creators.

No video editing experience. No coding. No engineering degree required to get started.

The AI handles the editing work. Your local studio is where you review, refine, and manage everything.

### 🎬 Want to see exactly how I use it?

I recorded an 11-minute, start-to-finish walkthrough showing how I turn raw footage into finished videos, including the little tricks I've learned to save hours of editing.

**[Get the free setup guide + see the full walkthrough →](https://mattpaige68.substack.com/p/its-here-my-entire-ai-video-editing)**

The entire studio and installation instructions are free. The walkthrough is an optional paid Substack benefit.

Here is a teaser of the walkthrough video:

https://github.com/user-attachments/assets/bc5030dc-d3f3-443a-a95b-c45130d863b6

## 🚀 Get started with one prompt

Getting your own studio set up is pretty simple.

1. Open Claude Code or Codex on your computer.
2. Paste the prompt below into a new chat.
3. Follow the setup instructions and open your studio.

Copy this exact prompt:

```text
Set up AI Video Studio from https://github.com/mattp68/ai-video-studio
using the newest published release, including beta releases,
in a new local folder.
Check the GitHub Releases page to identify the correct version
rather than using an older hardcoded tag or unreleased changes
from the main branch.
Read SETUP.md and AGENTS.md from that release first.
Check prerequisites and guide me through any missing system tools
with my authorization.
Install project-local dependencies and configure local transcription
if supported, or explain available alternatives.
Run the tests and full synthetic smoke workflow, report available
and unavailable capabilities, and open my local studio.
Preserve existing files.
Use my own footage, references and accounts; ask before paid services
or system-wide changes.
Do not publish my work.
```

Your assistant will guide you through any required installations and checks. Some dependencies may require your approval.

That's it. Your own AI video editing studio.

*The studio software is completely free. Your Claude/Codex plan and optional external AI services may have separate costs.*

## What you can do

- **Raw footage → clean cuts.** Find your best takes, remove dead space, and assemble your video.
- **Visual storyboards.** Review the creative direction before committing to a full edit.
- **AI-powered editing.** Create captions, B-roll, motion graphics, transitions, and sound effects using available tools.
- **Timestamped feedback.** Tell AI exactly what to change and keep previous versions.
- **Reusable reference library.** Save your videos, creative references, and editing techniques to use in future projects.

And there's plenty more you can do with it.

## 🔥 Want to get REALLY good at using it?

Installing the studio is one thing. Knowing how to get incredible videos out of it is where the real magic happens.

I've created a complete 11-minute video walkthrough and written guide showing my exact workflow.

How I use other creators' techniques, build storyboards, give feedback that actually works, and turn raw footage into finished videos.

All the stuff I figured out through trial and error, so you don't have to.

The walkthrough is available to paid subscribers of my Substack, **AI for the Rest of Us**, for $5/month or $50/year.

You also get access to my other in-depth AI tutorials, guides, and future workflows.

**[Watch the full walkthrough + get the written guide →](https://mattpaige68.substack.com/p/its-here-my-entire-ai-video-editing)**

The software is free either way. The walkthrough is just the shortcut to getting really freaking good at using it.

## How to use the studio · Как пользоваться студией · Comment utiliser le studio

*Adapted from [claude-video-studio](https://github.com/asaf5767/claude-video-studio) by Asaf — explanation of how the studio works, in three languages.*

### 🇬🇧 English

**How it works**

1. **Upload your footage and make choices with clicks.** Drag in your footage, images and logo. Then click to choose: how tight to cut, which look, which sound, and how long the video should be. No prompts to write.
2. **Add effects and choose how you look.** An After Effects–style effects board: every card shows the effect in action. You can ask for an effect to appear exactly when you say a certain word. And in the "How you look" tab: a new background behind you, text moving behind you, a sticker, a split screen and more. The studio separates you from the background on your own computer — nothing is sent to any external service.
3. **Send to the AI.** One click, and your AI assistant starts working. You can watch what it's doing right in the studio: transcription, silence removal, captions, graphics, sound and the storyboard. You can close the window — everything is saved.
4. **Review and approve.** For every storyboard scene: keep it, change it or drop it, with a note in your own words. The AI fixes it according to your notes, and in the end you get a finished MP4, ready to post.

**And more: inspiration from reels you liked.** Paste a link or drop in a reel you loved, and the studio learns its style (pacing, captions, transitions) to use in your next video.

**What's in the studio**

- A friendly web interface you open in your browser; you approve every step.
- Local transcription on your computer, free.
- Ready-made looks, effects and "how you look" styles.
- Faceless reels: you can also work with just your voice.
- iPhone videos work too.
- Optional extras: AI voice and images, with your own API key.

**What you need**

- Claude Code or Codex, installed and connected to your account.
- A Windows or Mac computer.
- Internet for the first-time setup; afterwards, editing runs on your own computer.
- About 3.5 GB of free disk space (most of it the speech-recognition model).
- First install takes roughly 15–45 minutes, depending on your internet speed.

**Opening the studio again**

Open Claude Code or Codex in the studio folder and ask it to open your studio — or from the terminal, inside the studio folder, run `python style-library/start.py --open` (on Windows use `py -3` if `python` doesn't work; on Mac use `python3`). If something gets stuck, ask your assistant to check the setup — it finds what's missing and completes only that. Manual instructions are in [SETUP.md](SETUP.md).

---

### 🇷🇺 Русский

**Как это работает**

1. **Загружаете съёмку и выбираете кликами.** Перетащите видео, картинки и логотип. Затем выбираете кликами: насколько плотно резать, какой стиль, какой звук и какой длительности будет видео. Писать промпты не нужно.
2. **Добавляете эффекты и выбираете, как вы выглядите.** Панель эффектов в стиле After Effects: каждая карточка показывает эффект в действии. Можно попросить, чтобы эффект появился ровно в момент, когда вы произносите определённое слово. А во вкладке «Как вы выглядите»: новый фон позади вас, текст, проходящий за вами, стикер, разделённый экран и многое другое. Студия отделяет вас от фона на вашем компьютере — ничего не отправляется в сторонние сервисы.
3. **Отправляете ИИ.** Одно нажатие — и ваш ИИ-ассистент начинает работу. Вы видите в студии, что он делает: транскрипция, удаление пауз, субтитры, графика, звук и раскадровка. Можно закрыть окно — всё сохраняется.
4. **Проверяете и утверждаете.** Для каждой сцены раскадровки: оставить, изменить или убрать — с комментарием своими словами. ИИ исправляет по вашим замечаниям, и в итоге вы получаете готовый MP4, который можно публиковать.

**И ещё: вдохновение из рилсов, которые вам понравились.** Вставьте ссылку или перетащите понравившийся рилс — студия изучит его стиль (темп, субтитры, переходы) и использует его в вашем следующем видео.

**Что внутри студии**

- Удобный веб-интерфейс в браузере; вы утверждаете каждый этап.
- Локальная транскрипция на вашем компьютере, бесплатно.
- Готовые стили, эффекты и варианты «как вы выглядите».
- Рилсы без лица: можно работать только со своим голосом.
- Видео с айфона тоже подходят.
- Дополнительно (необязательно): ИИ-озвучка и изображения с вашим собственным API-ключом.

**Что понадобится**

- Claude Code или Codex, установленный и подключённый к вашему аккаунту.
- Компьютер с Windows или Mac.
- Интернет для первой установки; дальше монтаж работает на вашем компьютере.
- Около 3,5 ГБ свободного места на диске (большая часть — модель распознавания речи).
- Первая установка занимает примерно 15–45 минут в зависимости от скорости интернета.

**Как снова открыть студию**

Откройте Claude Code или Codex в папке студии и попросите открыть студию — либо из терминала, в папке студии, выполните `python style-library/start.py --open` (в Windows используйте `py -3`, если `python` не работает; на Mac — `python3`). Если что-то зависло, попросите ассистента проверить установку — он найдёт, чего не хватает, и доустановит только это. Подробные инструкции — в [SETUP.md](SETUP.md).

---

### 🇫🇷 Français

**Comment ça marche**

1. **Vous importez vos rushs et vous choisissez en cliquant.** Glissez vos vidéos, images et logos. Puis choisissez en cliquant : à quel point serrer le montage, quel style, quel son et quelle durée. Pas de prompts à écrire.
2. **Vous ajoutez des effets et choisissez votre look.** Un panneau d'effets inspiré d'After Effects : chaque carte montre l'effet en action. Vous pouvez demander qu'un effet apparaisse exactement au moment où vous dites un mot précis. Et dans l'onglet « Votre look » : un nouvel arrière-plan derrière vous, du texte qui passe derrière vous, un sticker, un écran partagé et plus encore. Le studio vous détourage de l'arrière-plan sur votre propre ordinateur — rien n'est envoyé à un service externe.
3. **Vous envoyez à l'IA.** Un clic, et votre assistant IA se met au travail. Vous voyez dans le studio ce qu'il fait : transcription, suppression des silences, sous-titres, graphismes, son et storyboard. Vous pouvez fermer la fenêtre — tout est enregistré.
4. **Vous vérifiez et approuvez.** Pour chaque scène du storyboard : la garder, la modifier ou la supprimer, avec une note en vos propres mots. L'IA corrige selon vos remarques, et à la fin vous obtenez un MP4 prêt à publier.

**Et aussi : l'inspiration tirée des reels que vous avez aimés.** Collez un lien ou déposez un reel que vous avez adoré, et le studio en apprend le style (rythme, sous-titres, transitions) pour votre prochaine vidéo.

**Ce qu'il y a dans le studio**

- Une interface web conviviale dans le navigateur ; vous approuvez chaque étape.
- Une transcription locale sur votre ordinateur, gratuite.
- Des styles, des effets et des looks prêts à l'emploi.
- Des reels sans montrer votre visage : possible avec uniquement votre voix.
- Les vidéos de l'iPhone fonctionnent aussi.
- En option : voix et images IA, avec votre propre clé API.

**Ce qu'il faut**

- Claude Code ou Codex, installé et connecté à votre compte.
- Un ordinateur Windows ou Mac.
- Internet pour la première installation ; ensuite, le montage tourne sur votre ordinateur.
- Environ 3,5 Go d'espace disque libre (le plus gros étant le modèle de reconnaissance vocale).
- La première installation prend environ 15 à 45 minutes, selon votre vitesse internet.

**Rouvrir le studio**

Ouvrez Claude Code ou Codex dans le dossier du studio et demandez-lui de l'ouvrir — ou depuis le terminal, dans le dossier du studio, lancez `python style-library/start.py --open` (sous Windows, utilisez `py -3` si `python` ne fonctionne pas ; sous Mac, `python3`). Si quelque chose bloque, demandez à votre assistant de vérifier l'installation — il trouve ce qui manque et ne complète que ça. Les instructions détaillées sont dans [SETUP.md](SETUP.md).

---

*Crédit : cette section est adaptée de [claude-video-studio](https://github.com/asaf5767/claude-video-studio) (Asaf), lui-même basé sur AI Video Studio de Matt Paige — code ouvert sous licence MIT.*

## Documentation

For deeper technical details:

- [Full setup and troubleshooting](SETUP.md)
- [Editing workflow](docs/WORKFLOW.md)
- [Capabilities and optional tools](docs/CAPABILITIES.md)
- [Updates and upgrades](docs/UPDATING.md)
- [Security and privacy](SECURITY.md)

Your studio runs locally on your computer. Your personal projects and references are not included in the public repository.

## Support the project ⭐

If you find this useful, give the repo a star! It helps more people discover it.

And please share it with friends, teammates, or anyone who creates videos.

I'd love to see what you make. Tag me on Instagram ([@mpaige13](https://www.instagram.com/mpaige13/)) or TikTok ([@mattpaige68](https://www.tiktok.com/@mattpaige68)).

Found a bug or have a suggestion? [Open a GitHub issue](https://github.com/mattp68/ai-video-studio/issues).

Created by [Matt Paige](https://substack.com/@mattpaige68).

Released under the [MIT License](LICENSE). Third-party assets and dependencies retain their [own license terms](THIRD_PARTY_NOTICES.md).
