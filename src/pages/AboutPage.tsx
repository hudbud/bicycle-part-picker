import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Window, WindowHeader, WindowContent, GroupBox, Button } from 'react95'
import styled from 'styled-components'

const PageWindow = styled(Window)`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`

const Section = styled(GroupBox)`
  margin-bottom: 16px;
`

const Body = styled.p`
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 8px;
`

const Features = styled.dl`
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 14px;
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
  dt { font-weight: 700; }
  dd { margin: 0; }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 2px;
    dd { margin-bottom: 8px; }
  }
`

const A = styled(Link)`
  color: var(--win-link);
  text-decoration: underline;
`

export function AboutPage() {
  const navigate = useNavigate()
  const { hash } = useLocation()
  // Links like /about#accounts arrive by client-side navigation, which doesn't scroll to the id.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash])
  return (
    <PageWindow>
      <WindowHeader active><span>About Pedal Parts Picker</span></WindowHeader>
      <WindowContent>
        <Section label="What is Pedal Parts Picker?">
          <Body>
            Pedal Parts Picker is a build &amp; parts tracker for people who build, restore and maintain their own
            bikes. Put together a build with a compatibility checker and a running weight, then keep a record of
            each bike: what every part cost you, where it came from, its condition and serial, the odometer and the
            service log. Spares, take-offs and wishlist parts go in the Parts Bin, so you always know what you have
            and where it is.
          </Body>
          <Body>
            Behind that is a parts catalog of current and discontinued components, with specs and simulated retail
            and used-market prices to help you plan.
          </Body>
        </Section>

        <Section label="Your bikes &amp; parts">
          <Features>
            <dt><A to="/garage">Garage</A></dt>
            <dd>
              Every bike you own or are building, each with a stage (planning, building, riding, retired), what
              you&rsquo;ve spent and what&rsquo;s still to buy, its weight, the odometer and a service log (chain,
              brake, bearing and other work) in miles or kilometres.
            </dd>
            <dt><A to="/build">Builder</A></dt>
            <dd>
              A part list for the whole bike with a live compatibility checker (wheel sizes, axle standards, brake
              mounts, steerers and headsets, bottom brackets, freehubs, shift systems, clamp diameters and more)
              and an estimated weight. Mark each part planned, wanted, purchased or owned and record what you paid.
            </dd>
            <dt><A to="/parts">Parts Bin</A></dt>
            <dd>
              Your inventory: owned parts, spares, parts on the way and the wishlist, with price paid, source,
              date, condition and serial. It shows where each part is (in the bin or on which bike) and installs a
              part onto a bike in one step, sending the part it replaces back to the bin.
            </dd>
            <dt>Sharing &amp; backup</dt>
            <dd>
              Each build has a share link that encodes the whole part list, so anyone can open it without an
              account, and you can export it as Reddit / forum markup. No account needed: everything is stored in
              your browser. Sign in to have it on every device (see Accounts &amp; privacy below), and export a
              backup file from the Garage any time.
            </dd>
          </Features>
        </Section>

        <Section label="Browse &amp; research">
          <Features>
            <dt><A to="/products">Browse Parts</A></dt>
            <dd>
              Every category with filters for brand, specs, era (current production vs. discontinued &amp;
              vintage), price and a fit-my-build filter. Side-by-side compare, and product pages with full specs.
              From a product page you can add it to your build, mark that you have one, or add it to your wishlist.
            </dd>
            <dt><A to="/guides">Build Guides</A></dt>
            <dd>Curated builds at different budgets with notes on why each part was chosen.</dd>
            <dt><A to="/builds">Completed Builds</A></dt>
            <dd>A gallery of finished bikes to browse, borrow ideas from and copy into your builder.</dd>
            <dt><A to="/trends">Price Trends</A></dt>
            <dd>Category-wide price charts over six months, and the biggest drops and increases.</dd>
          </Features>
        </Section>

        <Section label="About the data">
          <Body>
            The parts catalog is based on real products, manufacturer list prices and claimed weights (which may
            be out of date). <strong>Retailer prices, stock, price history, ratings and the community builds are simulated sample
            data</strong>. No live price feed sits behind this site. Buy links open each retailer&rsquo;s
            search results for the part, so always check the real price before you order.
          </Body>
          <Body>
            Discontinued and vintage parts are labelled as such. Their prices are <strong>used-market estimates</strong>{' '}
            (typical eBay / Pinkbike / swap-meet value for decent condition), and their listings are simulated too.
            Prices you record yourself in the Garage and Parts Bin are your own and are never changed.
          </Body>
          <Body>
            Compatibility checks and weight estimates are a helpful first pass, not a guarantee. Confirm critical
            fits (axles, brake mounts, seatpost diameter, headset standard) with the manufacturer.
          </Body>
        </Section>

        <Section label="Add a missing frame" id="community-frames">
          <Body>
            The frame catalog is open to everyone. If yours is missing, open <A to="/submit/frame">Add a frame</A> (also
            on the Frames page and in the builder&rsquo;s frame picker), fill in its standards and press{' '}
            <strong>Submit to catalog</strong>. That opens a prefilled issue on GitHub (you need a free account). A bot
            checks every field within a minute and comments. After a maintainer reviews and merges it, the frame is in
            the catalog for everyone. You can see what&rsquo;s been submitted in the{' '}
            <a href="https://github.com/hudbud/bicycle-part-picker/issues?q=is%3Aissue+%5BFrame%5D" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--win-link)' }}>frame submissions</a>.
          </Body>
          <Body>
            Spotted a wrong spec? Every frame page has <strong>Suggest a correction</strong>, which works the same way.
            Can&rsquo;t wait? <strong>Use on my bike</strong> puts the frame in your build straight away, with its standards
            checked for compatibility.
          </Body>
        </Section>

        <Section label="Accounts &amp; privacy" id="accounts">
          <Body>
            Accounts are optional. Without one, everything you add (photos included) stays in this browser and
            nothing about you is sent anywhere.
          </Body>
          <Body>
            You can sign in <strong>with Google</strong>, which tells us your name, email address and profile picture
            and nothing else, or <strong>with an emailed link</strong>, which only needs your email address. We send
            those emails to sign you in and for nothing else. The same email address opens the same account either
            way. We keep your sign-in details, plus your garage, parts bin, custom parts, current build, settings and bike
            photos, so they&rsquo;re on every device you sign in on. Photos are viewable by anyone with their link (for
            example, on a bike page you share), and photos you remove are deleted from storage after a week. Your data is stored with
            Cloudflare, used only to run your account, and never sold or shared.
          </Body>
          <Body>
            The account menu (your name, top right) has <strong>Sign out</strong>, <strong>Sign out &amp; clear this
            browser</strong> for shared computers, and <strong>Delete account</strong>, which removes your account and
            everything saved to it straight away.
          </Body>
        </Section>

        <Section label="Open source &amp; contact">
          <Body>
            Pedal Parts Picker is open source. Contributions and bug reports welcome on{' '}
            <a href="https://github.com/hudbud/bicycle-part-picker" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', color: 'var(--win-link)' }}>GitHub</a>.
          </Body>
          <Body>
            Questions? Reach out at{' '}
            <a href="mailto:hudbud@gmail.com" style={{ textDecoration: 'underline', color: 'var(--win-link)' }}>hudbud@gmail.com</a>
          </Body>
        </Section>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button primary onClick={() => navigate('/garage')}>Open Garage</Button>
          <Button onClick={() => navigate('/build')}>Builder</Button>
          <Button onClick={() => navigate('/parts')}>Parts Bin</Button>
          <Button onClick={() => navigate('/products')}>Browse Parts</Button>
        </div>
      </WindowContent>
    </PageWindow>
  )
}
