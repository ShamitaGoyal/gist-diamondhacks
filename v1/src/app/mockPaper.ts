export interface MockPaperSection {
  id: string;
  title: string;
  content: string;
  /** Optional DOM anchor, e.g. `#methodology`. */
  slug?: string;
}

/** Mock manuscript sections (HTML lens — virtual “pages” map 1:1 to section order + title). */
export const MOCK_PAPER_SECTIONS: MockPaperSection[] = [
  {
    id: 'fig1',
    title: 'Figure 1',
    content: `Meridian is a design framework for creating overview-detail interfaces (ODIs) that are malleable by default. Traditionally, designers and developers build interfaces using their respective tools, but this separation makes it difficult to transfer designs across teams. At the same time, this process often excludes end-users from personalizing the very interfaces intended for them. Meridian introduces a specification language for ODIs that integrates with developer packages, UI design tools, and end-user interfaces—enabling all three groups to equally establish interface needs.`
  },
  {
    id: '1',
    title: 'Abstract',
    content: `Overview-detail interfaces (ODIs), which present an overview of multiple items alongside a detailed view of a selected item, are ubiquitously implemented in software interfaces. However, the current design and development pipeline lacks the infrastructure to easily support end-user customization, limiting its ability to support diverse information needs. This research envisions a development cycle for building malleable interfaces—one where designers, developers, and end-users alike can create, modify, and use the interface equally. To establish a foundation for this infrastructure, we introduce Meridian, a design framework for guiding and facilitating the creation of malleable ODIs. The framework consists of a high-level declarative specification language for ODIs as well as its tools, including a UI development package and a no-code web builder to facilitate the development and design of malleable ODIs. We demonstrate how Meridian supports designers, developers, and end-users alike in designing, implementing, and interacting with ODIs in novel ways using their respective familiar tools and platforms. Finally, we discuss technical tradeoffs, potential solutions, and opportunities for enabling interface malleability by default.

This work is licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.

UIST '25, Busan, Republic of Korea
© 2025 Copyright held by the owner/author(s).
ACM ISBN 979-8-4007-2037-6/25/09
https://doi.org/10.1145/3746059.3747654

CCS Concepts
• Human-centered computing → User interface toolkits.

Keywords
Malleable Interfaces, Overview-Detail Interfaces, Design Framework, Specification Language

ACM Reference Format:
Bryan Min and Haijun Xia. 2025. Meridian: A Design Framework for Malleable Overview-Detail Interfaces. In The 38th Annual ACM Symposium on User Interface Software and Technology (UIST '25), September 28–October 01, 2025, Busan, Republic of Korea. ACM, New York, NY, USA, 14 pages.
https://doi.org/10.1145/3746059.3747654`
  },
  {
    id: '2',
    title: '1 Introduction',
    content: `Overview-detail interfaces (ODIs) are among the most ubiquitous interface design patterns in information systems, as they support a fundamental information behavior—users often need to view an overview of large collections of information to identify ones of interest and then examine them in detail. ODIs can be found in our email clients, calendars, shopping websites, food delivery applications, and numerous others.

For decades, ODIs have been developed with a one-size-fits-all approach like many other software applications: developers configure a fixed overview (e.g., grid, map, timeline), determine which details to show in the overview, and define the composition and interaction of the views. However, a single configuration fails to meet the diverse needs of all users [23, 37]. Consequently, users must work with overviews that do not match their mental models and repeatedly switch between views to gather details of interest, hindering the effective use of information. To address this friction, Min et al. proposed the notion of malleable ODIs, which enables end-users to flexibly manipulate the presentation of attributes in the views as well as their composition and layout [36]. For example, end-users can customize a malleable ODI in a shopping website by surfacing couch dimensions into the overview and then transforming the overview into various representations such as a color space to explore couches by color. Such malleability was found empowering and desirable, as it enabled end-users to flexibly manipulate the ODI to suit their own needs [36].

Despite the potential of malleable ODIs, the existing UI design and development approach lacks the infrastructure to easily support malleability in interfaces. First, designers must create mockups for many, if not all, potential transformations available on the interface, requiring them to create and manage numerous combinations of variations. Second, developers must implement these designs from scratch, requiring them to bind attributes to the UI, organize views and their content, build their navigation logic, and re-implement customization features that are already present in other interfaces. Lastly, even if end-users can customize them, there is no succinct way of observing these customizations by designers and developers. While designers create ODI designs, developers implement ODIs in code, and end-users interact with them through the interface, they all perform their activities within their individual tools and languages. However, if we want malleability supported in interfaces by default, we must enable designers, developers, and end-users to equally establish an agreement on the information shown and interactions possible on the interface. To achieve this, we need a design convention that designers, developers, and end-users alike can easily adopt and share.

We propose Meridian, a design framework for guiding and facilitating the creation of malleable ODIs across all three stakeholders. At its core, Meridian is powered by a specification language that formalizes the conceptual model of ODIs. This specification language integrates into a development package that renders Meridian specifications into malleable ODIs and a visual website builder to explore variations of ODI designs. By leveraging the Meridian specification, designers can easily export and share ODI designs to developers, developers can instantly render them in the interface, and end-users can succinctly communicate customizations as logs back to designers and developers. By bridging familiar workflows across designers, developers, and end-users under a shared specification language, we reduce the cost to build and transfer malleable ODIs between different stakeholders.

We took an evaluation-by-demonstration approach [30] to showcase how three groups of major stakeholders, designers, developers, and end-users design, implement, and interact with ODIs in novel ways using their respective familiar tools and platforms. The Meridian specification, development package, interface builder, and a gallery of examples are open-source to invite broader collaboration and enable a thriving malleable ODI ecosystem.

https://github.com/meridian-ui/meridian

Overview
Item View
Detail View

Figure 2: The overview-detail design pattern makes up three components: overview, item view, and detail view. This example shows Etsy's search results page presenting items in a grid and a detail view in a new page.`
  },
  {
    id: '3',
    slug: 'malleable-odi',
    title: '2 Malleable ODI Design Convention',
    content: `We aim to establish and promote a design convention of malleable ODIs through a design framework. We first define malleable ODIs, discuss the envisioned benefits of establishing malleable ODIs as a design convention, and then introduce our design approach.`
  },
  {
    id: '3.1',
    title: '2.1 Malleable ODI Definition',
    content: `Malleable ODIs are extensions from overview-detail interfaces, which primarily involve three kinds of views (Fig. 2):

Overviews display a large collection of information entities using a specific organization structure to allow users to examine all the entities with the functional affordances of the structures. For example, an email client uses a list to organize emails by time, accommodation applications like Airbnb use a map for users to view homes by their location, and a scatterplot distributes data points by two number values.

Item Views represent information entities inside the overviews, and are positioned based on organizational rules of the overviews. Item views present key details that allow the users to gain an initial understanding of the information entities.

Detail Views contain all the details of an information entity. Detail views are typically invoked from the item views when users identify and open ones of interest.

Through an analysis of 303 ODIs found in existing websites, Min et al. identified three key design dimensions of ODIs [36]:

Content, describing which attributes are shown in each view.

Composition, describing the logical connections among views, such as how many overviews in the interface, and whether an overview opens one kind of pop-up or multiple.

Layout, describing the spatial arrangement of views within the interface and the interactions that invoke those views.

Following their analysis, they designed and developed malleable ODIs, ones that end-users can customize by transforming ODIs along variations in the three dimensions.`
  },
  {
    id: '3.2',
    title: '2.2 Design Approach',
    content: `The goal of our design framework is to establish a convention for malleable ODIs that enables malleability by default, yet can easily integrate into familiar tools for designers and developers. Our approach is informed by the definition of malleable ODIs and the aforementioned benefits that we wish to obtain.`
  }
];

/** Virtual page: 1 = title/front-matter, then each section +1. */
export function virtualPageForSectionId(sectionId: string | null): number {
  if (!sectionId) return 1;
  const idx = MOCK_PAPER_SECTIONS.findIndex((s) => s.id === sectionId);
  if (idx < 0) return 1;
  return idx + 2;
}
