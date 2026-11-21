// A made-up online-orders domain, used by the mock Notion server, the tests
// and the recall eval. Rows are listed in creation order, so unique IDs
// (ADR-1, OQ-1, REQ-1, …) follow the order below.

export const BOUNDED_CONTEXTS = ['Catalog', 'Ordering', 'Payments', 'Shipping'];

export const DATA_SOURCE_IDS = {
  glossary: '11111111-1111-4111-8111-111111111111',
  decisions: '22222222-2222-4222-8222-222222222222',
  openQuestions: '33333333-3333-4333-8333-333333333333',
  requirements: '44444444-4444-4444-8444-444444444444',
};

const bc = (...extra) => [...BOUNDED_CONTEXTS, ...extra];

export const SCHEMAS = {
  glossary: {
    title: 'Glossary',
    properties: [
      ['Term', 'title'],
      ['Kind', 'select', ['Term', 'Event', 'Role']],
      ['Bounded context', 'select', bc('Outside the system')],
      ['Definition', 'rich_text'],
      ['Status', 'status', ['Proposed', 'Agreed', 'Deprecated']],
      ['Source', 'select', ['Interview', 'Product', 'Engineering', 'Event storming', 'Backlog']],
      ['Replaces', 'rich_text'],
      ['Decision record', 'relation'],
      ['Changed by', 'last_edited_by'],
      ['Changed on', 'last_edited_time'],
    ],
  },
  decisions: {
    title: 'Decisions',
    properties: [
      ['Decision', 'title'],
      ['ADR', 'unique_id', 'ADR'],
      ['Summary', 'rich_text'],
      ['Status', 'status', ['Proposed', 'Accepted', 'Deprecated', 'Superseded']],
      ['Built', 'select', ['Not built', 'Partly', 'Built']],
      ['Bounded context', 'multi_select', bc('Spans contexts')],
      ['Team', 'multi_select', ['Product', 'Engineering']],
      ['Depends on', 'relation'],
      ['Enables', 'relation'],
      ['Supersedes', 'relation'],
      ['Superseded by', 'relation'],
      ['Glossary rows', 'relation'],
      ['Decided by', 'people'],
      ['Decided on', 'date'],
      ['Created', 'created_time'],
    ],
  },
  openQuestions: {
    title: 'Open questions',
    properties: [
      ['Question', 'title'],
      ['OQ', 'unique_id', 'OQ'],
      ['Status', 'status', ['Open', 'Answered', 'Dropped']],
      ['Answer', 'rich_text'],
      ['Answered on', 'date'],
      ['Owner', 'people'],
      ['Provenance', 'rich_text'],
      ['Bounded context', 'multi_select', bc('Spans contexts')],
      ['Requirements', 'relation'],
      ['Decision', 'relation'],
      ['Counts as open', 'formula'],
      ['Created', 'created_time'],
    ],
  },
  requirements: {
    title: 'Requirements',
    properties: [
      ['Requirement', 'title'],
      ['REQ', 'unique_id', 'REQ'],
      ['Plain English', 'rich_text'],
      ['Precise statement', 'rich_text'],
      ['Source', 'select', ['Interview', 'Meeting', 'Product', 'Customer', 'Regulation', 'Engineering', 'Backlog']],
      ['Provenance', 'rich_text'],
      ['Bounded context', 'multi_select', bc('Spans contexts')],
      ['Status', 'select', ['Proposed', 'Agreed', 'Deferred', 'Dropped', 'Superseded']],
      ['Built', 'select', ['Not built', 'Partly', 'Built']],
      ['Decisions', 'relation'],
      ['Glossary terms', 'relation'],
      ['Questions', 'relation'],
      ['Open questions', 'rollup'],
      ['Linear tickets', 'rich_text'],
      ['Created', 'created_time'],
    ],
  },
};

export const ROWS = {
  glossary: [
    { Term: 'Product', Kind: 'Term', 'Bounded context': 'Catalog', Status: 'Agreed', Definition: 'Something the shop sells, with a name, a price and a stock level.' },
    { Term: 'Stock level', Kind: 'Term', 'Bounded context': 'Catalog', Status: 'Agreed', Definition: 'How many of a product the shop can sell right now.' },
    { Term: 'Basket', Kind: 'Term', 'Bounded context': 'Ordering', Status: 'Deprecated', Definition: 'Old word for the products a customer has picked.' },
    { Term: 'Cart', Kind: 'Term', 'Bounded context': 'Ordering', Status: 'Agreed', Replaces: 'Basket', Definition: 'The products a customer has picked but not yet ordered.' },
    { Term: 'Order', Kind: 'Term', 'Bounded context': 'Ordering', Status: 'Agreed', Definition: "A customer's request to buy one or more products, made at checkout." },
    { Term: 'Order line', Kind: 'Term', 'Bounded context': 'Ordering', Status: 'Agreed', Definition: 'One product and its quantity within an order.' },
    { Term: 'Order Placed', Kind: 'Event', 'Bounded context': 'Ordering', Status: 'Agreed', Definition: 'Recorded when a customer confirms checkout and the order exists.' },
    { Term: 'Order Cancelled', Kind: 'Event', 'Bounded context': 'Ordering', Status: 'Proposed', Definition: 'Recorded when an order is cancelled before it ships.' },
    { Term: 'Payment', Kind: 'Term', 'Bounded context': 'Payments', Status: 'Agreed', Definition: 'Money a customer pays for an order.' },
    { Term: 'Payment Captured', Kind: 'Event', 'Bounded context': 'Payments', Status: 'Agreed', Definition: "Recorded when the money is taken from the customer's card." },
    { Term: 'Refund', Kind: 'Term', 'Bounded context': 'Payments', Status: 'Proposed', Definition: 'Money returned to a customer for all or part of an order.' },
    { Term: 'Shipment', Kind: 'Term', 'Bounded context': 'Shipping', Status: 'Agreed', Definition: "A parcel that leaves the warehouse with some or all of an order's lines." },
    { Term: 'Order Shipped', Kind: 'Event', 'Bounded context': 'Shipping', Status: 'Agreed', Definition: 'Recorded when the first shipment for an order leaves the warehouse.' },
    { Term: 'Customer', Kind: 'Role', 'Bounded context': 'Outside the system', Status: 'Agreed', Definition: 'A person who buys from the shop.' },
    { Term: 'Picker', Kind: 'Role', 'Bounded context': 'Outside the system', Status: 'Proposed', Definition: "A warehouse worker who collects an order's products from the shelves." },
  ],
  decisions: [
    { Decision: "Orders can't change once placed", Status: 'Accepted', Built: 'Built', 'Bounded context': ['Ordering'], Summary: 'An Order is fixed after Order Placed; changes are a cancellation and a new order.' },
    { Decision: 'Rename Basket to Cart', Status: 'Accepted', Built: 'Built', 'Bounded context': ['Ordering'], Summary: 'The glossary and code say Cart; Basket is Deprecated.' },
    { Decision: 'Payments listens for Order Placed instead of reading order tables', Status: 'Accepted', Built: 'Partly', 'Bounded context': ['Payments', 'Ordering'], Summary: 'Payments starts work on the Order Placed event; it never reads Ordering tables.' },
    { Decision: 'Capture payment when the order ships', Status: 'Accepted', Built: 'Not built', 'Bounded context': ['Payments', 'Shipping'], Summary: 'Payment Captured happens on Order Shipped, not at checkout.' },
    { Decision: 'Cancelling an order refunds it through Payments', Status: 'Proposed', Built: 'Not built', 'Bounded context': ['Ordering', 'Payments'], Summary: 'Order Cancelled triggers a Refund in Payments; Ordering never moves money.' },
    { Decision: 'Hold stock for 30 minutes at checkout', Status: 'Proposed', Built: 'Not built', 'Bounded context': ['Catalog', 'Ordering'], Summary: 'Checkout reserves Stock level for 30 minutes, then releases it.' },
    { Decision: 'One shipment per warehouse', Status: 'Superseded', Built: 'Built', 'Bounded context': ['Shipping'], Summary: 'Each warehouse sends one Shipment per Order.' },
    { Decision: 'Allow split shipments from one warehouse', Status: 'Accepted', Built: 'Partly', 'Bounded context': ['Shipping'], Summary: 'A warehouse can send in-stock lines now and the rest later as further Shipments.' },
    { Decision: 'Store money as whole minor units', Status: 'Accepted', Built: 'Built', 'Bounded context': ['Spans contexts'], Summary: 'Amounts are integers in the currency minor unit (cents), never floats.' },
  ],
  openQuestions: [
    { Question: 'Can a customer cancel an order after part of it has shipped?', Status: 'Open', 'Bounded context': ['Ordering', 'Shipping'] },
    { Question: 'Who approves refunds above the automatic limit?', Status: 'Open', 'Bounded context': ['Payments'] },
    { Question: 'Does a price change affect products already in a cart?', Status: 'Answered', 'Bounded context': ['Catalog', 'Ordering'], Answer: 'No: a cart keeps the price shown when the product was added.' },
    { Question: 'Is Shipping a separate bounded context from Ordering?', Status: 'Open', 'Bounded context': ['Shipping'] },
  ],
  requirements: [
    { Requirement: 'Customer places an order from a cart', Status: 'Agreed', Built: 'Built', 'Bounded context': ['Ordering'] },
    { Requirement: 'Customer cancels an order before it ships', Status: 'Agreed', Built: 'Not built', 'Bounded context': ['Ordering'] },
    { Requirement: 'Refund a cancelled order automatically', Status: 'Proposed', Built: 'Not built', 'Bounded context': ['Payments'] },
    { Requirement: "Customer sees each shipment's tracking link", Status: 'Proposed', Built: 'Partly', 'Bounded context': ['Shipping'] },
    { Requirement: 'Hold stock for a customer during checkout', Status: 'Deferred', 'Bounded context': ['Catalog'] },
  ],
};
