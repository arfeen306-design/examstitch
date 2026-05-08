# Grade 11 Mathematics — Topical Worksheet
## Topic 7: Conditional Probability & Tree Diagrams
*Cambridge O-Level (4024) / IGCSE (0580) — Advanced / A* Exam Prep*

---

### 📘 Topic Concept

**Conditional Probability** of $B$ given $A$ has occurred:

$$P(B\mid A)=\dfrac{P(A\cap B)}{P(A)}\qquad(P(A)>0)$$

**Multiplication Rule**:

$$P(A\cap B)=P(A)\cdot P(B\mid A)$$

**Independent events**: $P(B\mid A)=P(B)$, equivalently $P(A\cap B)=P(A)\cdot P(B)$.

**Mutually Exclusive events**: $P(A\cap B)=0$, so $P(A\cup B)=P(A)+P(B)$.

**General Addition Rule**:

$$P(A\cup B)=P(A)+P(B)-P(A\cap B)$$

**Tree Diagrams** — multiply along branches; add over all branches that satisfy the event.

**Without replacement** — successive probabilities depend on previous draws (denominator decreases).

**Bayes' approach** (informal): update prior beliefs using observed evidence.

---

### 📝 Questions  *(Total: 41 marks)*

**Question 1** *[3]*
Given $P(A)=0.6$, $P(B)=0.5$, $P(A\cap B)=0.3$, find:
**(a)** $P(A\cup B)$ *[1]*
**(b)** $P(A\mid B)$ *[1]*
**(c)** State whether $A$ and $B$ are independent. Justify. *[1]*

---

**Question 2** *[3]*
A bag contains $5$ red and $3$ green balls. Two balls are drawn **without replacement**. Find:
**(a)** $P(\text{both red})$ *[1]*
**(b)** $P(\text{first red, second green})$ *[1]*
**(c)** $P(\text{both same colour})$ *[1]*

---

**Question 3** *[4]*
A box has $7$ blue and $5$ yellow markers. Two markers are picked at random *with replacement*. Calculate:
**(a)** $P(BB)$, *[1]*
**(b)** $P(\text{exactly one blue})$, *[2]*
**(c)** $P(\text{at least one blue})$. *[1]*

---

**Question 4** *[4]*
The probability that a student passes Maths is $0.7$ and Physics is $0.6$. Pass-rates in the two subjects are independent.
Find the probability the student:
**(a)** passes both, *[1]*
**(b)** passes exactly one, *[2]*
**(c)** fails both. *[1]*

---

**Question 5** *[4]*
A jar has $4$ caramels and $6$ mints. Three sweets are drawn *without replacement*.
**(a)** Find $P(\text{all three are mints})$. *[2]*
**(b)** Find $P(\text{exactly two mints})$. *[2]*

---

**Question 6** *[4]*
Of $50$ students, $30$ take Biology, $25$ take Chemistry, $15$ take both.
A student is chosen at random.
**(a)** Find $P(\text{Biology or Chemistry})$. *[1]*
**(b)** Given that the student takes Biology, find the probability they take Chemistry. *[2]*
**(c)** Are taking Biology and taking Chemistry independent? Justify. *[1]*

---

**Question 7** *[4]*
A factory uses two machines $M_{1}$ and $M_{2}$ producing $60\%$ and $40\%$ of items respectively. The defect rates are $3\%$ for $M_{1}$ and $5\%$ for $M_{2}$.
**(a)** Draw a tree diagram. *[1]*
**(b)** Find $P(\text{a randomly chosen item is defective})$. *[2]*
**(c)** Given an item is defective, find $P(\text{it came from }M_{1})$. *[1]*

---

**Question 8** *[4]*
A test for a disease is $95\%$ accurate (it returns the correct result $95\%$ of the time, both for diseased and healthy patients). The disease affects $1\%$ of the population.
**(a)** Calculate the probability that a randomly selected person tests positive. *[3]*
**(b)** Given a positive test, find the probability the person actually has the disease, correct to $3$ s.f. *[1]*

---

**Question 9** *[4]*
$A$ and $B$ are independent events with $P(A)=0.4$ and $P(B)=0.5$. Find:
**(a)** $P(A\cap B)$, *[1]*
**(b)** $P(A\cup B)$, *[1]*
**(c)** $P(\text{exactly one of }A,B)$, *[2]*

---

**Question 10 — Investigation** *[7]*
A box contains $4$ white, $3$ red, and $3$ black balls. Three balls are drawn *without replacement*.
**(a)** Find $P(\text{all three white})$. *[2]*
**(b)** Find $P(\text{one of each colour})$ (i.e. one white, one red, one black). *[3]*
**(c)** Find $P(\text{none white})$. *[2]*

---

### ✅ Answer Key

**Q1.**
**(a)** $0.6+0.5-0.3=\boxed{0.8}$.
**(b)** $\dfrac{0.3}{0.5}=\boxed{0.6}$.
**(c)** $P(A\mid B)=0.6=P(A)$ — yes, **independent**.

---

**Q2.** Total $=8$.
**(a)** $\dfrac{5}{8}\cdot\dfrac{4}{7}=\boxed{\dfrac{5}{14}}$.
**(b)** $\dfrac{5}{8}\cdot\dfrac{3}{7}=\boxed{\dfrac{15}{56}}$.
**(c)** $P(RR)+P(GG)=\dfrac{5}{14}+\dfrac{3}{8}\cdot\dfrac{2}{7}=\dfrac{5}{14}+\dfrac{3}{28}=\dfrac{10+3}{28}=\boxed{\dfrac{13}{28}}$.

---

**Q3.** Total $=12$.
**(a)** $\left(\dfrac{7}{12}\right)^{2}=\boxed{\dfrac{49}{144}}$.
**(b)** $2\cdot\dfrac{7}{12}\cdot\dfrac{5}{12}=\dfrac{70}{144}=\boxed{\dfrac{35}{72}}$.
**(c)** $1-\left(\dfrac{5}{12}\right)^{2}=1-\dfrac{25}{144}=\boxed{\dfrac{119}{144}}$.

---

**Q4.**
**(a)** $0.7\times 0.6=\boxed{0.42}$.
**(b)** $0.7\cdot 0.4+0.3\cdot 0.6=0.28+0.18=\boxed{0.46}$.
**(c)** $0.3\times 0.4=\boxed{0.12}$.

---

**Q5.** Total $=10$.
**(a)** $\dfrac{6}{10}\cdot\dfrac{5}{9}\cdot\dfrac{4}{8}=\dfrac{120}{720}=\boxed{\dfrac{1}{6}}$.
**(b)** Two mints + one caramel — order matters per arrangement, but we sum positions:

$$3\cdot\dfrac{6}{10}\cdot\dfrac{5}{9}\cdot\dfrac{4}{8}=3\cdot\dfrac{1}{6}\;\Rightarrow\text{Wait — the constant changes per slot.}$$

Re-do: $P(MMC)=\dfrac{6}{10}\cdot\dfrac{5}{9}\cdot\dfrac{4}{8}=\dfrac{1}{6}$. By symmetry $P(MCM)=\dfrac{6}{10}\cdot\dfrac{4}{9}\cdot\dfrac{5}{8}=\dfrac{1}{6}$ and $P(CMM)=\dfrac{4}{10}\cdot\dfrac{6}{9}\cdot\dfrac{5}{8}=\dfrac{1}{6}$.

$$P(\text{exactly 2 mints})=3\cdot\dfrac{1}{6}=\boxed{\dfrac{1}{2}}$$

---

**Q6.** Total $=50$.
**(a)** $|B\cup C|=30+25-15=40$. $P=\boxed{\dfrac{4}{5}}$.
**(b)** $P(C\mid B)=\dfrac{P(B\cap C)}{P(B)}=\dfrac{15/50}{30/50}=\boxed{\dfrac{1}{2}}$.
**(c)** $P(C\mid B)=\dfrac{1}{2}\neq P(C)=\dfrac{1}{2}$. Actually $P(C)=\dfrac{25}{50}=\dfrac{1}{2}$, so $P(C\mid B)=P(C)$ → **independent** ✓.

---

**Q7.**
**(a)** Two main branches: $M_{1}\;(0.6)$ or $M_{2}\;(0.4)$; each then defective ($0.03$ or $0.05$) or not.
**(b)** $P(D)=0.6\cdot 0.03+0.4\cdot 0.05=0.018+0.02=\boxed{0.038}$.
**(c)** $P(M_{1}\mid D)=\dfrac{0.018}{0.038}\approx\boxed{0.474}$ (3 s.f.).

---

**Q8.** Let $D$ = has disease ($P=0.01$), $T^{+}$ = positive test.
$P(T^{+}\mid D)=0.95$, $P(T^{+}\mid D')=0.05$.
**(a)** $P(T^{+})=0.01\cdot 0.95+0.99\cdot 0.05=0.0095+0.0495=\boxed{0.059}$.
**(b)** $P(D\mid T^{+})=\dfrac{0.0095}{0.059}\approx\boxed{0.161}$ (3 s.f.).

*(Note: even with a $95\%$ accurate test, only $\sim 16\%$ of positives are true cases when the disease is rare — base-rate fallacy.)*

---

**Q9.**
**(a)** $0.4\cdot 0.5=\boxed{0.2}$.
**(b)** $0.4+0.5-0.2=\boxed{0.7}$.
**(c)** $0.4\cdot 0.5+0.6\cdot 0.5=0.2+0.3=\boxed{0.5}$.

---

**Q10.** Total $=10$.
**(a)** $\dfrac{4}{10}\cdot\dfrac{3}{9}\cdot\dfrac{2}{8}=\dfrac{24}{720}=\boxed{\dfrac{1}{30}}$.

**(b)** Choose any order of W, R, B. $P(WRB)=\dfrac{4}{10}\cdot\dfrac{3}{9}\cdot\dfrac{3}{8}=\dfrac{36}{720}=\dfrac{1}{20}$. There are $3!=6$ orderings.

$$P=6\cdot\dfrac{1}{20}=\boxed{\dfrac{3}{10}}$$

**(c)** Non-white pool $=6$ balls. $P=\dfrac{6}{10}\cdot\dfrac{5}{9}\cdot\dfrac{4}{8}=\dfrac{120}{720}=\boxed{\dfrac{1}{6}}$.

---

*End of Worksheet — Grade 11 / Topic 7 / Conditional Probability & Tree Diagrams*
