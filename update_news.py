#!/usr/bin/env python3
import os
import json
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET
import email.utils
from datetime import datetime, timezone, timedelta
import subprocess


# List of RSS feeds to aggregate raw news from
FEEDS = {
    "World": [
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en"
    ],
    "India": [
        "https://news.google.com/rss/headlines/section/topic/NATION?hl=en-IN&gl=IN&ceid=IN:en",
        "https://timesofindia.indiatimes.com/rssfeeds/296589.cms"
    ],
    "Business": [
        "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
        "https://feeds.bbci.co.uk/news/business/rss.xml"
    ],
    "Technology": [
        "https://techcrunch.com/feed/",
        "https://feeds.bbci.co.uk/news/technology/rss.xml"
    ],
    "Science": [
        "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en",
        "https://www.nature.com/nature.xml"
    ],
    "Sports": [
        "https://www.espn.com/espn/rss/news",
        "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en"
    ],
    "Entertainment": [
        "https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-US&gl=US&ceid=US:en"
    ]
}

# High-quality fallback seed data for June 27, 2026
SEED_STORIES = [
    {
        "rank": 1,
        "title": "Strikes in the Strait: US Hits Targets in Iran After Shipping Attacks",
        "category": "World",
        "excerpt": "In a sharp escalation of Middle East tensions, the US military launched strikes inside Iran, targeting missile and drone sites following a shipping attack.",
        "content": "Tensions in the Strait of Hormuz—the world’s most critical choke point for oil shipments—just reached a boiling point. The US military, acting under CENTCOM, launched precision airstrikes inside Iran, targeting radar installations and storage facilities for drones and missiles.\n\nWhy the sudden escalation? The strikes were a direct response to a drone attack on a commercial shipping vessel in the Strait. Over the last few weeks, shipping companies have been playing a stressful game of maritime roulette, navigating key trade lanes while dodging hostile drones. The US and its allies decided enough was enough, launching the strikes to degrade Iran's capability to target merchant ships.\n\nIn response, Iran’s Islamic Revolutionary Guard Corps (IRGC) claimed it launched retaliatory strikes against US military bases in the region. Thankfully, initial reports suggest minimal damage, but the psychological impact is massive.\n\nWhy does this matter to you? The Strait of Hormuz is a narrow stretch of water where about a fifth of the world's petroleum passes daily. If shipping lanes are blocked or become too dangerous, insurance rates for cargo ships skyrocket, oil prices spike, and global inflation gets another unwelcome booster shot.\n\nWhat’s next? Diplomats in Washington, Brussels, and Gulf capitals are working the phones in overdrive to prevent a wider regional conflict. The big question is whether this remains a contained back-and-forth exchange or triggers a larger maritime blockade. For now, oil markets are watching nervously, hoping cooler heads prevail.",
        "source_url": "https://www.reuters.com/world/middle-east/",
        "read_time": 3
    },
    {
        "rank": 2,
        "title": "A Path for Peace: Israel and Lebanon Sign Historic Framework Deal",
        "category": "World",
        "excerpt": "Lebanon and Israel have signed a US-brokered framework agreement in Washington, aiming to end decades of cross-border conflict.",
        "content": "In a surprising diplomatic breakthrough, Lebanon and Israel have signed a US-brokered 'framework deal' in Washington. After five intense rounds of closed-door negotiations, representatives from both nations put pen to paper, establishing a path toward lasting security and a cessation of hostilities along their volatile border.\n\nFor decades, the border between Israel and Lebanon has been a flashpoint of rockets, drone strikes, and military incursions, driven by deep-rooted geopolitical rivalries. The new agreement outlines a process for resolving border disputes, establishing a demilitarized buffer zone, and setting up joint security mechanisms monitored by international forces.\n\nWho is behind this? Credit goes to intense shuttle diplomacy by US mediators, who managed to convince both sides that continuing the border conflict was economically and politically ruinous. For Lebanon, which is enduring a prolonged economic collapse, stability is desperate. For Israel, securing its northern front is a major strategic priority.\n\nWhy it matters? This deal is the most significant step toward peace between the two neighbors in a generation. It won't solve all regional disputes overnight, but it creates a structured diplomatic channel to de-escalate tensions before they spiral into full-scale war.\n\nWhat’s next? The framework has to be implemented on the ground, which means moving troops, establishing new border posts, and enforcing the demilitarized zone. Skeptics point out that powerful local factions could try to derail the agreement. However, the signature in Washington represents a rare glimmer of hope for a region desperately in need of stability.",
        "source_url": "https://www.bbc.com/news/world-middle-east",
        "read_time": 3
    },
    {
        "rank": 3,
        "title": "Operation Amistad: India Flies Relief to Earthquake-Stricken Venezuela",
        "category": "India",
        "excerpt": "India has launched a major humanitarian mission, dispatching IAF aircraft laden with search-and-rescue teams and medical aid to Venezuela.",
        "content": "Following a catastrophic 7.1 magnitude earthquake that struck the northern coast of Venezuela, India has launched 'Operation Amistad' (Spanish for friendship). Two massive Indian Air Force (IAF) transport aircraft have taken off, carrying specialized search-and-rescue teams, mobile field hospitals, and tons of emergency medical supplies.\n\nThe situation in Venezuela is dire. The earthquake hit densely populated coastal towns, causing widespread structural collapses. The official death toll has climbed past 900, with thousands injured and tens of thousands displaced. Local emergency services have been completely overwhelmed, prompting a global call for humanitarian assistance.\n\nIndia’s response was immediate. The IAF dispatched C-17 Globemaster aircraft, which are essentially flying warehouses capable of carrying heavy machinery and rescue vehicles across continents. The Indian teams include members of the National Disaster Response Force (NDRF), who are highly trained in extracting survivors from collapsed concrete structures.\n\nWhy this matters? This mission highlights India's growing role as a primary responder in global humanitarian crises. By projecting disaster-relief capabilities across the Atlantic, New Delhi is demonstrating its commitment to being a responsible global power, moving beyond regional aid to global logistics.\n\nWhat’s next? The Indian rescue teams are expected to land in Caracas within hours and will be deployed immediately to the hardest-hit zones. Over the coming days, the focus will shift from search-and-rescue to preventing the outbreak of waterborne diseases and setting up temporary shelters. It's a race against time, but India's swift mobilization is a crucial lifeline for Venezuela.",
        "source_url": "https://www.mea.gov.in/",
        "read_time": 3
    },
    {
        "rank": 4,
        "title": "Miracle in Munich: Ecuador Beats Germany in World Cup Shock",
        "category": "Sports",
        "excerpt": "Ecuador pulled off one of the greatest upsets in football history, defeating Germany to qualify for the FIFA World Cup knockout stages.",
        "content": "In a match that will be talked about for generations, Ecuador has defeated football powerhouse Germany to seal a spot in the FIFA World Cup knockout rounds. The stunning 2-1 victory sent shockwaves through the sporting world and triggered a wave of pure euphoria across South America.\n\nEcuador, considered heavy underdogs, played with a relentless energy that caught the German side off guard. After going down early to a clinical German goal, the Ecuadorians fought back, scoring an equalizer before halftime and netting a dramatic winner in the 88th minute. The final whistle was met with tears of joy from the Ecuadorian players and absolute disbelief from the German fans.\n\nBack in Ecuador, the reaction was so overwhelming that the government officially declared a national holiday to allow citizens to celebrate. Streets in Quito and Guasiyquil were flooded with fans wearing yellow jerseys, honking horns, and dancing late into the night.\n\nWhy it matters? Germany is a four-time World Cup champion and was widely expected to cruise into the knockouts. Ecuador's victory is a classic David-and-Goliath story, proving once again that in tournament football, passion and teamwork can overcome sheer star power and deep pockets. It shakes up the tournament bracket, sending a clear warning to other title contenders.\n\nWhat’s next? Ecuador advances to the Round of 16, where they will face another tough opponent, but they will do so with immense momentum and the belief that they can beat anyone. Germany, meanwhile, faces a painful post-mortem and an early flight home, leaving their fans demanding major reforms in their national team setup.",
        "source_url": "https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup",
        "read_time": 3
    },
    {
        "rank": 5,
        "title": "Cricket Shock: Ireland Stuns India in T20 Opener",
        "category": "Sports",
        "excerpt": "Ireland’s men's cricket team made history by securing a comprehensive 34-run victory over a full-strength Indian side.",
        "content": "In a result that has left cricket pundits rubbing their eyes in disbelief, Ireland’s men's cricket team has defeated India by 34 runs in the opening match of their T20 series. Playing in Dublin, the Irish side outplayed the world’s top-ranked T20 team in every department of the game.\n\nIreland batted first and posted a formidable total, thanks to some aggressive hitting in the middle overs. When it was India’s turn to bat, the Irish bowlers executed their plans perfectly, taking frequent wickets and suffocating India’s superstar batting lineup. Despite a brief fightback in the death overs, India fell well short of the target.\n\nWhy is this a big deal? India is the financial and competitive powerhouse of global cricket, boasting some of the highest-paid and most experienced players in the world. Ireland, while a Test-playing nation, operates with a fraction of the resources. A victory like this is rare and represents a massive milestone for Irish cricket.\n\nWhy did it happen? Ireland played fearless cricket, exploiting their home conditions and catching a slightly complacent Indian side off guard. The victory proves that the gap between the traditional cricket giants and associate/emerging nations is shrinking in the fast-paced T20 format, where a single good performance can decide the match.\n\nWhat’s next? The victory gives Ireland a historic 1-0 lead in the series. India will be desperate to bounce back and save face in the remaining matches. But for Ireland, this win is a statement of intent, proving they belong on the big stage and earning them valuable ranking points as they build toward future ICC tournaments.",
        "source_url": "https://www.cricketireland.ie/",
        "read_time": 3
    },
    {
        "rank": 6,
        "title": "Closing the Deal: US and India Near Historic Trade Agreement",
        "category": "Business",
        "excerpt": "US Secretary of State Marco Rubio indicated that a major US-India trade deal is close to completion, ahead of a planned presidential visit.",
        "content": "Relations between the world's two largest democracies are about to get a major economic upgrade. US Secretary of State Marco Rubio announced that a comprehensive trade agreement between the United States and India is entering its final stages of negotiations, with an official signing expected later this year.\n\nThe trade deal aims to lower tariffs on a wide range of goods, from agricultural products to high-tech electronics, and streamline regulations for investments. It’s the culmination of years of diplomatic wrangling, as both countries sought to protect domestic industries while expanding market access.\n\nWhy now? Geopolitics is the driving force. Both Washington and New Delhi are eager to diversify supply chains away from China. By integrating their economies more closely, the US gains a massive manufacturing partner and consumer market, while India secures access to advanced technology and capital to fuel its economic expansion.\n\nWhy does it matter? Trade between the US and India already exceeds $190 billion annually, but economists believe this deal could push it past $300 billion in the coming years. It will make it easier for Indian tech firms to operate in the US and allow American tech giants to build larger manufacturing footprints in India.\n\nWhat’s next? Secretary Rubio is expected to visit New Delhi in the autumn to finalize the text. The deal will lay the groundwork for a proposed state visit by US President Donald Trump in early 2027. If approved by both legislatures, the agreement could reshape trade patterns across the Indo-Pacific region, sealing a powerful economic alliance.",
        "source_url": "https://www.ustr.gov/",
        "read_time": 3
    },
    {
        "rank": 7,
        "title": "Silicon Privacy: Apple’s New Chip Runs AI Locally Without the Cloud",
        "category": "Technology",
        "excerpt": "In a major privacy play, Apple’s latest M-series chips are designed to run complex generative AI models directly on your device, bypassing the cloud entirely.",
        "content": "As the AI gold rush continues, tech companies have faced a persistent dilemma: running massive artificial intelligence models requires sending your personal data to giant cloud servers, raising serious privacy concerns. Now, Apple is trying to solve this by moving the brain directly onto your silicon.\n\nAt their developer conference, Apple unveiled new chips that feature a massive, upgraded 'Neural Engine' designed specifically to run generative AI models locally on Macs, iPads, and iPhones. This means tasks like writing emails, editing images, and even coding can be handled without sending a single byte of data to an external server.\n\nHow did they pull this off? They utilized advanced 'quantization' techniques, which essentially compress large AI models into smaller, lightweight files that can run efficiently on a device's local memory without draining the battery.\n\nWhy it matters? This is a significant shift in the AI landscape. While companies like Google and Microsoft have leaned heavily on cloud-based AI, Apple is making privacy its primary selling point. If your AI processing happens entirely on your device, your private notes, photos, and messages are completely safe from hackers and corporate data collection. It also means AI features will work offline. You could write code or translate languages while stuck in airplane mode.\n\nWhat’s next? Apple’s competitors are rushing to match this on-device capability. Over the next year, we will see a wave of AI-powered laptops and smartphones hit the market, transforming AI from a remote web service into a standard offline utility on every device. It's a win for user privacy, and a clear sign that the future of AI is local.",
        "source_url": "https://www.apple.com/newsroom/",
        "read_time": 3
    },
    {
        "rank": 8,
        "title": "Earthquakes in Venezuela: Rescue Teams Race Against the Clock",
        "category": "World",
        "excerpt": "A series of powerful earthquakes has devastated Venezuela’s northern coast, leaving over 900 dead and triggering an international rescue effort.",
        "content": "A series of devastating earthquakes, culminating in a powerful 7.1 magnitude tremor, has struck Venezuela’s northern coast. The disaster has caused widespread destruction in cities and towns, turning buildings into rubble and triggering landslides that have blocked key supply routes.\n\nThe official death toll has risen to 920, with local officials warning that the number is expected to climb as rescue workers reach remote coastal villages. Over 3,000 people are reported injured, and hospitals in the region are running out of basic medical supplies and clean water.\n\nWhy did it happen? Venezuela lies near the boundary between the Caribbean and South American tectonic plates, making it prone to seismic activity. However, this earthquake is the most powerful to strike the country in decades. The impact was worsened by aging infrastructure and a lack of earthquake-resistant building practices in densely populated areas.\n\nWhy does it matter? The disaster has triggered a major international humanitarian crisis. Countries from around the world are sending aid, including search-and-rescue teams, medical units, and food supplies. The response is a crucial test of global disaster relief cooperation during a time of heightened geopolitical tensions.\n\nWhat’s next? The immediate priority is the search for survivors trapped under the rubble. Sniffer dogs and thermal imaging equipment are being used to locate signs of life. Once the initial rescue phase ends, the country faces a long and expensive rebuilding process that will require billions of dollars in international assistance and years of work.",
        "source_url": "https://www.un.org/en/play-section",
        "read_time": 3
    },
    {
        "rank": 9,
        "title": "Streaming Records Broken: World Cup Draws Historic Digital Audience",
        "category": "Entertainment",
        "excerpt": "The ongoing FIFA World Cup in North America is shattering all previous records for live digital streaming viewership.",
        "content": "The FIFA World Cup in North America is turning out to be a historic event, not just on the pitch, but on our screens. Broadcast executives have confirmed that the tournament has shattered all previous records for live digital streaming, drawing hundreds of millions of viewers globally.\n\nIn the past, major sporting events were viewed primarily on traditional cable and satellite television. However, this World Cup has seen a massive shift toward streaming services and digital platforms. The match between Ecuador and Germany, in particular, drew record-breaking traffic, temporarily straining streaming networks in South America and Europe.\n\nWhy is this happening? The streaming infrastructure has matured, allowing platforms to deliver high-definition, low-latency live feeds to millions of concurrent users. Additionally, mobile networks and smart TVs have become more affordable and widespread, making digital streaming the preferred way to watch sports for a global audience.\n\nWhy it matters? This milestone marks the official arrival of live sports as the primary battleground for streaming platforms. Companies are investing billions of dollars to secure exclusive broadcasting rights for events like the Olympics, NFL, and Premier League, realizing that live sports are the ultimate tool to attract and retain subscribers.\n\nWhat’s next? We can expect streaming giants to bid even more aggressively for future sports rights, potentially driving traditional cable networks out of the market. For viewers, it means more choice and convenience, but also the likelihood of needing multiple subscriptions to follow their favorite sports. The digital revolution of live entertainment is officially complete.",
        "source_url": "https://www.fifa.com/",
        "read_time": 3
    },
    {
        "rank": 10,
        "title": "Fusion Energy Record: A New Milestone for Limitless Clean Power",
        "category": "Science",
        "excerpt": "Scientists have sustained a nuclear fusion reaction at extreme temperatures for a record duration, bringing clean energy closer to reality.",
        "content": "Nuclear fusion is the holy grail of clean energy, promising a limitless source of power with zero carbon emissions and no long-lived radioactive waste. Now, a team of international scientists has taken a major step toward making this dream a reality, setting a new record for sustaining fusion plasma.\n\nUsing a Tokamak—a giant, doughnut-shaped device that uses powerful magnetic fields to contain super-hot plasma—the researchers managed to sustain a fusion reaction at over 100 million degrees Celsius for several minutes. This temperature is roughly six times hotter than the core of the Sun.\n\nWhy is this a big deal? The main challenge of fusion energy is containing the extremely hot, turbulent plasma before it hits the reactor walls and cools down. Previously, reactors could only sustain the reaction for a few seconds. The new record was achieved by using advanced AI models to monitor and adjust the magnetic fields in real-time, predicting and preventing plasma instabilities.\n\nWhy does it matter? It proves that we are gaining control over one of the most complex processes in the universe. While we are still decades away from plugging a fusion power plant into the grid, this achievement shifts the focus from experimental physics to engineering design, bringing us closer to a future of limitless, clean energy.\n\nWhat’s next? The team will share their data with the international ITER project in France, which is building the world's largest fusion reactor. The goal is to design materials that can withstand the intense heat and radiation of a commercial fusion power plant. The journey is long, but the star in the jar is staying lit longer than ever.",
        "source_url": "https://www.iter.org/",
        "read_time": 3
    }
]

def parse_pub_date(pub_date_str):
    """Parses standard RSS date string into timezone-aware datetime."""
    try:
        return email.utils.parsedate_to_datetime(pub_date_str)
    except Exception:
        return None

def fetch_rss_feeds(lookback_hours=48):
    """Fetches titles and links from configure RSS feeds to feed to Gemini API."""
    print(f"Aggregating raw news data from RSS feeds (last {lookback_hours} hours)...")
    aggregated_data = []
    
    now_tz = datetime.now(timezone.utc)
    max_age = timedelta(hours=lookback_hours)
    
    # We will fetch a subset of items to avoid hitting token limits
    for category, urls in FEEDS.items():
        for url in urls:
            try:
                req = urllib.request.Request(
                    url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 BrieflyNews/1.0'}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    xml_data = response.read()
                    root = ET.fromstring(xml_data)
                    
                    count = 0
                    for item in root.findall('.//item'):
                        if count >= 10:  # Limit per feed
                            break
                        
                        pub_date = item.find('pubDate')
                        pub_date_text = pub_date.text if pub_date is not None else ""
                        
                        # Apply date filter: Skip articles older than 48 hours to prevent stale news
                        if pub_date_text:
                            dt = parse_pub_date(pub_date_text)
                            if dt:
                                age = now_tz - dt
                                if age > max_age:
                                    continue
                        
                        title = item.find('title')
                        link = item.find('link')
                        description = item.find('description')
                        
                        title_text = title.text if title is not None else ""
                        link_text = link.text if link is not None else ""
                        desc_text = description.text if description is not None else ""
                        
                        aggregated_data.append({
                            "category": category,
                            "title": title_text,
                            "link": link_text,
                            "description": desc_text,
                            "date": pub_date_text
                        })
                        count += 1
            except Exception as e:
                print(f"Skipping feed {url} due to error: {e}")
                
    return aggregated_data

def generate_with_gemini(api_key, raw_news):
    """Uses Gemini API to curate, rank and write the 10 daily stories with model fallback."""
    models_to_try = [
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest"
    ]
    
    prompt = f"""
You are "briefly", a witty, conversational, and highly intelligent news editor.
Analyze the following raw news articles gathered from RSS feeds over the past 24 hours.
Select the exactly 10 most globally important or interesting stories.
For each selected story, write a fully original article between 300 and 500 words.

Guidelines for EACH article:
1. WORD COUNT: Approximately 300–500 words. Keep it comprehensive but readable.
2. TONE: Conversational, witty, and occasionally humorous. Think of a smart, well-read friend explaining the news over coffee. Avoid sarcasm, cynicism, or direct political preaching. Keep it engaging and balanced.
3. LANGUAGE: Simple, clear English. Translate complex topics (e.g. quantum computing, central banking, biotechnology) so that an intelligent non-expert can immediately grasp them.
4. FACTS: Cover: What happened, Why it happened, Who is involved, Why it matters, and What could happen next.
5. NO JARGON: Remove industry jargon. If you must use a technical term, explain it naturally.
6. STYLES: Break into clean paragraphs (2-4 sentences each) so it is comfortable to read on small screens.
7. CRITERIA: No clickbait, no sensational headlines, no unnecessary personal opinions.
8. LINKS: Set 'source_url' to the actual URL of the article from the feed so readers can look deeper.
9. RATING: Rate 'read_time' in minutes (estimated at ~130 words per minute, so 300-500 words should be 2 to 4 minutes).

Raw News Data:
{json.dumps(raw_news[:80])} # limit to top 80 items to stay safe on context limit
"""

    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "stories": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "rank": { "type": "INTEGER", "description": "Rank from 1 (most important) to 10" },
                                "title": { "type": "STRING", "description": "Compelling, clean headline (no clickbait)" },
                                "category": { "type": "STRING", "enum": ["World", "India", "Business", "Technology", "Science", "Sports", "Entertainment"] },
                                "excerpt": { "type": "STRING", "description": "A crisp, engaging 1-2 sentence preview" },
                                "content": { "type": "STRING", "description": "The full 300-500 word article text, with paragraphs separated by double newlines (\\n\\n)" },
                                "source_url": { "type": "STRING", "description": "The URL linking to the original source" },
                                "read_time": { "type": "INTEGER", "description": "Estimated reading time in minutes (2 to 4)" }
                            },
                            "required": ["rank", "title", "category", "excerpt", "content", "source_url", "read_time"]
                        }
                    }
                },
                "required": ["stories"]
            }
        }
    }
    
    for model in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        print(f"Calling Gemini API using model '{model}'...")
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                content_text = res_data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(content_text)
        except urllib.error.HTTPError as e:
            print(f"HTTP Error calling Gemini API with {model}: {e.code} {e.reason}")
            try:
                error_body = e.read().decode("utf-8")
                print("Response body:", error_body)
            except:
                pass
            print(f"Retrying with next model fallback...")
        except Exception as e:
            print(f"Error calling Gemini API with {model}: {e}")
            print(f"Retrying with next model fallback...")
            
    return None

def load_env():
    """Manually parses a local .env file and sets environment variables."""
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    if "=" in line:
                        key, val = line.split("=", 1)
                        os.environ[key.strip()] = val.strip().strip('"').strip("'")

def git_push_changes(file_path):
    auto_push = os.environ.get("AUTO_PUSH_TO_GITHUB", "false").lower() == "true"
    if not auto_push:
        return
        
    print("AUTO_PUSH_TO_GITHUB is enabled. Preparing to commit and push changes...")
    try:
        # Check if git is initialized
        work_dir = os.path.dirname(os.path.abspath(__file__))
        git_dir = os.path.join(work_dir, ".git")
        if not os.path.exists(git_dir):
            print("Warning: Local directory is not a git repository. Skipping push.")
            return

        # Add stories.json
        subprocess.run(["git", "add", file_path], check=True, cwd=work_dir)
        
        # Check if there is anything to commit
        status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True, check=True, cwd=work_dir)
        if not status.stdout.strip():
            print("No changes to commit in stories.json.")
            return
            
        # Commit changes
        subprocess.run(["git", "commit", "-m", "Daily news update [skip ci]"], check=True, cwd=work_dir)
        
        # Push changes to remote origin on main branch
        subprocess.run(["git", "push", "origin", "main"], check=True, cwd=work_dir)
        print("Successfully pushed latest news updates to GitHub!")
    except Exception as e:
        print(f"Error executing auto git push: {e}")

def main():
    load_env()
    api_key = os.environ.get("GEMINI_API_KEY")
    
    # Parse lookback hours config
    try:
        lookback_hours = int(os.environ.get("LOOKBACK_HOURS", "48"))
    except ValueError:
        lookback_hours = 48

    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "stories.json")
    
    # Metadata for the update
    now = datetime.utcnow()
    last_updated_str = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    stories_data = None
    
    if api_key and api_key != "your_gemini_api_key_here":
        print("Gemini API key found. Fetching raw news and preparing update...")
        raw_news = fetch_rss_feeds(lookback_hours=lookback_hours)
        if raw_news:
            stories_data = generate_with_gemini(api_key, raw_news)
        else:
            print("Failed to fetch raw news feeds. Using high-quality seed stories.")
    else:
        print("No active GEMINI_API_KEY environment variable or config found. Initializing with pre-seeded high-quality stories.")
    
    # Fallback to seed stories if generation failed or no API key
    if not stories_data:
        print("Writing seeded stories to data/stories.json...")
        stories_data = {"stories": SEED_STORIES}
        
    # Inject dynamic metadata
    stories_data["last_updated"] = last_updated_str
    
    # Write to target JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(stories_data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully updated stories. Saved to {output_path}")
    
    # Run git auto push if enabled
    git_push_changes(output_path)

if __name__ == "__main__":
    main()
