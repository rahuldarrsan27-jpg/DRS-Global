import { Experience } from '@/components/Experience';
import { ScrollController } from '@/components/ScrollController';
import { Overlay } from '@/components/ui/Overlay';
import { Nav } from '@/components/ui/Nav';
import { ProgressRail } from '@/components/ui/ProgressRail';
import { MobileProgress } from '@/components/ui/MobileProgress';
import { Cursor } from '@/components/ui/Cursor';
import { Preloader } from '@/components/ui/Preloader';
import { ScrollHint } from '@/components/ui/ScrollHint';
import { VideoLayer } from '@/components/ui/VideoLayer';
import { FilmGrain } from '@/components/ui/FilmGrain';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { JOURNEY_LENGTH_VH, CHAPTERS } from '@/lib/journey';
import { COPY, BRAND, CTA, CONTACT, ABOUT } from '@/lib/content';

export default function Page() {
  return (
    <>
      <Preloader />
      <ScrollController />

      {/* The world */}
      <Experience />

      {/* Optional cinematic plates — renders nothing until video files exist */}
      <VideoLayer />

      {/* Photographic finish over everything — video, canvas and scrims alike */}
      <FilmGrain />

      {/* Interface */}
      <Overlay />
      <Nav />
      <ProgressRail />
      <MobileProgress />
      <SoundToggle />
      <ScrollHint />
      <Cursor />

      <main>
        {/*
          The scroll spacer. It has no content and no paint cost — it exists
          purely to give the document the height that the journey is mapped
          onto. Everything visible is fixed-position above it.
        */}
        <div
          className="journey-spacer"
          style={{ height: `${JOURNEY_LENGTH_VH}vh` }}
          aria-hidden="true"
        />

        {/*
          Linear document.

          The experience is a canvas driven by scroll position, which is not a
          structure a crawler or a screen reader can traverse. This gives both a
          conventional outline of the same information — headings, lists, real
          links — without affecting the visual composition.
        */}
        <section id="contact" className="sr-only">
          <h2>{BRAND.name} — capabilities index</h2>
          <p>{BRAND.positioning}</p>
          <p>{BRAND.tagline}</p>

          <h3>About DRS Global</h3>
          <p>{ABOUT.body}</p>
          <p>{ABOUT.body2}</p>

          {CHAPTERS.filter((c) => COPY[c.id].services).map((c) => {
            const copy = COPY[c.id];
            return (
              <section key={c.id}>
                <h3>{copy.title?.replace(/\n/g, ' ')}</h3>
                <p>{copy.body}</p>
                <ul>
                  {copy.services?.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </section>
            );
          })}

          <h3>Contact</h3>
          <p>{BRAND.closing}</p>
          <p>{CTA.intro}</p>
          <p>{CTA.prompt}</p>
          <ul>
            <li>
              Email: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
            </li>
            {CONTACT.founders.map((f) => (
              <li key={f.name}>
                {f.name}: <a href={`tel:${f.tel}`}>{f.display}</a>
              </li>
            ))}
            <li>
              Website: <a href={CONTACT.domainHref}>{CONTACT.domain}</a>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
